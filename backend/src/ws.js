/**
 * WebSocket relay – pushes real-time execution results to connected browser clients.
 */

import { logger } from './logger.js';

const clients = new Set();

export function setupWebSocket(wss) {
  wss.on('connection', (ws, req) => {
    logger.info(`WS client connected from ${req.socket.remoteAddress}`);
    clients.add(ws);

    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        logger.info(`WS message: ${JSON.stringify(msg)}`);
        // Echo back to sender (can be extended to relay to daemons)
        ws.send(JSON.stringify({ type: 'ack', received: msg }));
      } catch {
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid JSON' }));
      }
    });

    ws.on('close', () => {
      clients.delete(ws);
      logger.info('WS client disconnected');
    });
  });
}

/**
 * Broadcast a message to all connected WebSocket clients.
 * Used to push execution results in real-time.
 */
export function broadcast(payload) {
  const msg = JSON.stringify(payload);
  for (const ws of clients) {
    if (ws.readyState === 1 /* OPEN */) {
      ws.send(msg);
    }
  }
}
