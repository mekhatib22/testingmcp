/**
 * /api/machines – register, list, and remove daemon machines.
 */

import { Router } from 'express';
import { registerMachine, listMachines, getMachine, removeMachine } from '../registry.js';

const router = Router();

/** GET /api/machines – list all registered machines */
router.get('/', (_req, res) => {
  res.json({ machines: listMachines() });
});

/** POST /api/machines – register a new daemon machine */
router.post('/', (req, res) => {
  const { name, daemonUrl, daemonId } = req.body;
  if (!daemonUrl) {
    return res.status(400).json({ error: "Missing required field 'daemonUrl'" });
  }
  const machine = registerMachine({ name, daemonUrl, daemonId });
  return res.status(201).json({ machine });
});

/** GET /api/machines/:id */
router.get('/:id', (req, res) => {
  const machine = getMachine(req.params.id);
  if (!machine) return res.status(404).json({ error: 'Machine not found' });
  return res.json({ machine });
});

/** DELETE /api/machines/:id */
router.delete('/:id', (req, res) => {
  const machine = getMachine(req.params.id);
  if (!machine) return res.status(404).json({ error: 'Machine not found' });
  removeMachine(req.params.id);
  return res.json({ status: 'removed' });
});

export default router;
