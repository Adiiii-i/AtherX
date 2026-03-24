import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import apiRoutes from './routes/api.js';
import setupSockets from './sockets/index.js';
import store from './store.js';

const app = express();
const httpServer = createServer(app);

const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((s) => s.trim().replace(/\/$/, ''));

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`[cors] Blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200,
};

const io = new Server(httpServer, {
  cors: corsOptions,
  maxHttpBufferSize: 1e5, // 100 KB max WebSocket payload
});

app.use(cors(corsOptions));
app.use(express.json({ limit: '10kb' }));
app.set('trust proxy', 1);

// ── Routes ──────────────────────────────────────────────────
app.use('/api', apiRoutes);
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// ── WebSocket layer ─────────────────────────────────────────
setupSockets(io);

// ── Start ───────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;

async function start() {
  await store.connect();
  httpServer.listen(PORT, () => {
    console.log(`🔒 Whisper server running on port ${PORT}`);
  });
}

start();
