/**
 * Authentication middleware.
 * When BACKEND_AUTH_TOKEN is set, all protected routes require the
 * "Authorization: Bearer <token>" header.
 */

const AUTH_TOKEN = process.env.BACKEND_AUTH_TOKEN || '';

export function requireAuth(req, res, next) {
  if (!AUTH_TOKEN) return next();

  const header = req.headers['authorization'] || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : header;

  if (token !== AUTH_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  return next();
}
