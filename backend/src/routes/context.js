/**
 * /api/context – shared key-value context store for multi-agent workflows.
 */

import { Router } from 'express';

const router = Router();
const store = {};

/** GET /api/context */
router.get('/', (_req, res) => {
  res.json({ context: store });
});

/** GET /api/context/:key */
router.get('/:key', (req, res) => {
  const { key } = req.params;
  if (!(key in store)) return res.status(404).json({ error: `Key '${key}' not found` });
  return res.json({ key, value: store[key] });
});

/** POST /api/context */
router.post('/', (req, res) => {
  const { key, value } = req.body;
  if (!key) return res.status(400).json({ error: "Missing 'key'" });
  store[key] = value;
  return res.json({ status: 'stored', key });
});

/** DELETE /api/context/:key */
router.delete('/:key', (req, res) => {
  const { key } = req.params;
  if (!(key in store)) return res.status(404).json({ error: `Key '${key}' not found` });
  delete store[key];
  return res.json({ status: 'deleted', key });
});

export { store };
export default router;
