/**
 * /api/execute – relay a prompt to a CLI daemon machine.
 */

import { Router } from 'express';
import fetch from 'node-fetch';
import { getMachine, touchMachine } from '../registry.js';
import { logger } from '../logger.js';

const router = Router();

/**
 * POST /api/execute
 * Body: { machineId, agent, prompt, flags? }
 */
router.post('/', async (req, res) => {
  const { machineId, agent, prompt, flags } = req.body;

  if (!machineId) return res.status(400).json({ error: "Missing 'machineId'" });
  if (!agent) return res.status(400).json({ error: "Missing 'agent'" });
  if (!prompt) return res.status(400).json({ error: "Missing 'prompt'" });

  const machine = getMachine(machineId);
  if (!machine) return res.status(404).json({ error: `Machine '${machineId}' not registered` });

  touchMachine(machineId);

  const daemonUrl = `${machine.daemonUrl}/api/execute`;
  logger.info(`Relaying to daemon ${machine.name} → ${daemonUrl}`);

  try {
    const daemonToken = process.env.DAEMON_AUTH_TOKEN || '';
    const headers = { 'Content-Type': 'application/json' };
    if (daemonToken) headers['X-Auth-Token'] = daemonToken;

    const daemonRes = await fetch(daemonUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({ agent, prompt, flags: flags || [] }),
      signal: AbortSignal.timeout(70_000),
    });

    const data = await daemonRes.json();
    return res.status(daemonRes.status).json(data);
  } catch (err) {
    logger.error(`Daemon relay error: ${err.message}`);
    return res.status(502).json({ error: `Failed to reach daemon: ${err.message}` });
  }
});

export default router;
