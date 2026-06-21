import crypto from 'node:crypto';

export function requestIdMiddleware(req, res, next) {
  const existing = req.headers['x-request-id'];
  const requestId = existing || crypto.randomUUID();
  req.id = requestId;
  res.setHeader('x-request-id', requestId);
  next();
}
