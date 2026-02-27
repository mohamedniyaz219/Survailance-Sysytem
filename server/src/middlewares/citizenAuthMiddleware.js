import jwt from 'jsonwebtoken';

export default function citizenAuthMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const token = authHeader.split(' ')[1];
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    return res.status(500).json({ error: 'JWT secret not configured' });
  }

  try {
    const payload = jwt.verify(token, secret);

    if (payload.role !== 'global_citizen') {
      return res.status(403).json({ error: 'Only registered users can access this route' });
    }

    req.user = payload;
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}
