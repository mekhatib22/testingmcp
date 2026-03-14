/**
 * Express application – routes and middleware.
 */

import express from 'express';
import cors from 'cors';
import machinesRouter from './routes/machines.js';
import executeRouter from './routes/execute.js';
import contextRouter from './routes/context.js';
import { requireAuth } from './middleware/auth.js';
import { logger } from './logger.js';

const app = express();

// ── Middleware ────────────────────────────────────────────────────────────────
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  : ['http://localhost:3000'];

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());

app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/machines', requireAuth, machinesRouter);
app.use('/api/execute', requireAuth, executeRouter);
app.use('/api/context', requireAuth, contextRouter);

// ── 404 / Error handlers ─────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  logger.error(err.message);
  res.status(500).json({ error: 'Internal server error' });
});

export default app;
