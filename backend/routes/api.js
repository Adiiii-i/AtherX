import { Router } from 'express';
import { customAlphabet } from 'nanoid';
import store from '../store.js';

const router = Router();

// Collision-resistant code generator (excludes ambiguous chars I, O)
const alphabet = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ';
const generate = customAlphabet(alphabet, 6);

/** Format raw 6-char string into X7K-29P style */
function formatCode(raw) {
  return `${raw.slice(0, 3)}-${raw.slice(3)}`;
}

/* ── Simple IP-based rate limiter for room creation ──────── */
const rateMap = new Map();
const RATE_WINDOW_MS = 5_000; // 1 room per 5 seconds per IP

function rateLimit(req, res, next) {
  const ip = req.ip;
  const now = Date.now();
  const last = rateMap.get(ip);
  if (last && now - last < RATE_WINDOW_MS) {
    return res.status(429).json({ error: 'Too many requests. Please wait a moment.' });
  }
  rateMap.set(ip, now);
  next();
}

// Periodically clean old rate-limit entries
setInterval(() => {
  const cutoff = Date.now() - RATE_WINDOW_MS * 2;
  for (const [ip, ts] of rateMap) {
    if (ts < cutoff) rateMap.delete(ip);
  }
}, 60_000);

/* ── Routes ──────────────────────────────────────────────── */

const ALLOWED_TTLS = [300, 1800, 86400]; // 5 min, 30 min, 24 h

router.post('/room', rateLimit, async (req, res) => {
  try {
    const { ttl = 86400 } = req.body;
    const safeTtl = ALLOWED_TTLS.includes(ttl) ? ttl : 86400;
    const roomId = formatCode(generate());

    await store.createRoom(roomId, safeTtl);
    res.json({ roomId, ttl: safeTtl });
  } catch (err) {
    console.error('[api] create room error:', err);
    res.status(500).json({ error: 'Failed to create room' });
  }
});

router.get('/room/:id', async (req, res) => {
  try {
    const exists = await store.roomExists(req.params.id);
    if (!exists) {
      return res.status(404).json({ error: 'Room not found or expired' });
    }
    const room = await store.getRoom(req.params.id);
    res.json({ exists: true, users: room?.users ?? 0 });
  } catch (err) {
    console.error('[api] check room error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
