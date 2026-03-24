import { createClient } from 'redis';

/**
 * Unified store abstraction — uses Redis if available, otherwise falls back
 * to an in-memory Map with setTimeout-based TTL. The public API is identical
 * regardless of backing store so the rest of the server doesn't care.
 */
class Store {
  constructor() {
    this.memory = new Map();
    this.timers = new Map();
    this.redis = null;
    this.useRedis = false;
  }

  async connect() {
    const url = process.env.REDIS_URL;
    if (url) {
      try {
        this.redis = createClient({ url });
        this.redis.on('error', (err) =>
          console.warn('[redis] connection error:', err.message)
        );
        await this.redis.connect();
        this.useRedis = true;
        console.log('✓ Connected to Redis');
      } catch {
        console.warn('⚠ Redis unavailable — using in-memory store');
      }
    } else {
      console.log('ℹ No REDIS_URL set — using in-memory store');
    }
  }

  /* ── Room CRUD ───────────────────────────────────────────── */

  async createRoom(roomId, ttlSeconds = 86400) {
    const data = {
      users: 0,
      maxUsers: 2,
      createdAt: Date.now(),
      ttl: ttlSeconds,
    };

    if (this.useRedis) {
      await this.redis.setEx(
        `room:${roomId}`,
        ttlSeconds,
        JSON.stringify(data)
      );
    } else {
      this.memory.set(roomId, data);
      const timer = setTimeout(() => {
        this.memory.delete(roomId);
        this.timers.delete(roomId);
      }, ttlSeconds * 1000);
      this.timers.set(roomId, timer);
    }
  }

  async roomExists(roomId) {
    if (this.useRedis) {
      return (await this.redis.exists(`room:${roomId}`)) === 1;
    }
    return this.memory.has(roomId);
  }

  async getRoom(roomId) {
    if (this.useRedis) {
      const raw = await this.redis.get(`room:${roomId}`);
      return raw ? JSON.parse(raw) : null;
    }
    return this.memory.get(roomId) ?? null;
  }

  async updateRoom(roomId, patch) {
    const existing = await this.getRoom(roomId);
    if (!existing) return;
    const merged = { ...existing, ...patch };

    if (this.useRedis) {
      const ttl = await this.redis.ttl(`room:${roomId}`);
      await this.redis.setEx(
        `room:${roomId}`,
        ttl > 0 ? ttl : 86400,
        JSON.stringify(merged)
      );
    } else {
      this.memory.set(roomId, merged);
    }
  }

  async deleteRoom(roomId) {
    if (this.useRedis) {
      await this.redis.del(`room:${roomId}`);
    } else {
      const timer = this.timers.get(roomId);
      if (timer) clearTimeout(timer);
      this.memory.delete(roomId);
      this.timers.delete(roomId);
    }
  }
}

const store = new Store();
export default store;
