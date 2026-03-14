/**
 * Backend relay server entry point.
 * Starts the Express HTTP server and WebSocket relay.
 */

import 'dotenv/config';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import app from './app.js';
import { setupWebSocket } from './ws.js';
import { logger } from './logger.js';

const PORT = parseInt(process.env.PORT || '3001', 10);

const server = createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });
setupWebSocket(wss);

server.listen(PORT, () => {
  logger.info(`Backend relay listening on port ${PORT}`);
});

export default server;
