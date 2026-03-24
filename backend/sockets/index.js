import store from '../store.js';

/* ── Anonymous label generator ───────────────────────────── */
const ADJ = [
  'Silent', 'Swift', 'Bright', 'Calm', 'Bold',
  'Warm', 'Cool', 'Wise', 'Free', 'Wild',
  'Gentle', 'Keen', 'Lucid', 'Noble', 'Vivid',
];
const NOUN = [
  'Fox', 'River', 'Star', 'Moon', 'Wind',
  'Wave', 'Peak', 'Dove', 'Sage', 'Pine',
  'Ember', 'Frost', 'Coral', 'Lynx', 'Hawk',
];

function randomLabel() {
  const a = ADJ[Math.floor(Math.random() * ADJ.length)];
  const n = NOUN[Math.floor(Math.random() * NOUN.length)];
  return `${a} ${n}`;
}

/* ── Per-socket bookkeeping (all in-memory, never persisted) */
const socketRoom = new Map();   // socketId → roomId
const socketLabel = new Map();  // socketId → label
const roomSockets = new Map();  // roomId   → Set<socketId>

/* ── Message rate limiter ────────────────────────────────── */
const msgRate = new Map(); // socketId → { count, resetAt }
const MAX_MSG_PER_SEC = 5;
const MAX_PAYLOAD = 10_240; // 10 KB

function isRateLimited(socketId) {
  const now = Date.now();
  let bucket = msgRate.get(socketId);
  if (!bucket || now > bucket.resetAt) {
    bucket = { count: 0, resetAt: now + 1000 };
  }
  bucket.count++;
  msgRate.set(socketId, bucket);
  return bucket.count > MAX_MSG_PER_SEC;
}

/* ── Socket handlers ─────────────────────────────────────── */

export default function setupSockets(io) {
  io.on('connection', (socket) => {
    const label = randomLabel();
    socketLabel.set(socket.id, label);

    /* ── Join room ─────────────────────────────────────── */
    socket.on('join-room', async (roomId, cb) => {
      try {
        if (!(await store.roomExists(roomId))) {
          return cb({ error: 'Room not found or expired' });
        }

        const current = roomSockets.get(roomId)?.size ?? 0;
        if (current >= 2) {
          return cb({ error: 'Room is full (max 2 users)' });
        }

        // Leave previous room if any
        const prev = socketRoom.get(socket.id);
        if (prev) {
          socket.leave(prev);
          roomSockets.get(prev)?.delete(socket.id);
        }

        // Join new room
        socket.join(roomId);
        socketRoom.set(socket.id, roomId);
        if (!roomSockets.has(roomId)) roomSockets.set(roomId, new Set());
        roomSockets.get(roomId).add(socket.id);

        const count = roomSockets.get(roomId).size;
        await store.updateRoom(roomId, { users: count });

        // Find peer label (if any)
        let peerLabel = null;
        if (count === 2) {
          for (const id of roomSockets.get(roomId)) {
            if (id !== socket.id) {
              peerLabel = socketLabel.get(id);
              break;
            }
          }
        }

        socket.to(roomId).emit('user-joined', { label, count });
        cb({ success: true, label, userCount: count, peerLabel });
      } catch (err) {
        console.error('[ws] join-room error:', err);
        cb({ error: 'Server error' });
      }
    });

    /* ── Encrypted message relay ───────────────────────── */
    socket.on('chat-message', (data) => {
      const roomId = socketRoom.get(socket.id);
      if (!roomId) return;
      if (isRateLimited(socket.id)) return;
      if (data.encrypted?.length > MAX_PAYLOAD) return;

      socket.to(roomId).emit('chat-message', {
        encrypted: data.encrypted,
        iv: data.iv,
        id: data.id,
        timestamp: Date.now(),
        label: socketLabel.get(socket.id),
        burn: !!data.burn,
      });
    });

    /* ── Typing indicator ──────────────────────────────── */
    socket.on('typing', (isTyping) => {
      const roomId = socketRoom.get(socket.id);
      if (!roomId) return;
      socket.to(roomId).emit('typing', {
        label: socketLabel.get(socket.id),
        isTyping,
      });
    });

    /* ── Seen indicator ────────────────────────────────── */
    socket.on('message-seen', (messageId) => {
      const roomId = socketRoom.get(socket.id);
      if (!roomId) return;
      socket.to(roomId).emit('message-seen', messageId);
    });

    /* ── Disconnect ────────────────────────────────────── */
    socket.on('disconnect', async () => {
      const roomId = socketRoom.get(socket.id);
      if (roomId) {
        roomSockets.get(roomId)?.delete(socket.id);
        const remaining = roomSockets.get(roomId)?.size ?? 0;

        socket.to(roomId).emit('user-left', {
          label: socketLabel.get(socket.id),
          count: remaining,
        });

        if (remaining === 0) {
          // Both left → destroy room immediately
          await store.deleteRoom(roomId);
          roomSockets.delete(roomId);
        } else {
          await store.updateRoom(roomId, { users: remaining });
        }

        socketRoom.delete(socket.id);
      }

      socketLabel.delete(socket.id);
      msgRate.delete(socket.id);
    });
  });
}
