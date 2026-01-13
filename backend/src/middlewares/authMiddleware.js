import jwt from 'jsonwebtoken';

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  const businessCodeHeader = req.headers['x-business-code'];

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

    if (!businessCodeHeader) {
      return res.status(400).json({ error: 'Missing x-business-code header' });
    }

    // Ensure token is scoped to the same tenant as the request header.
    if (!payload.businessCode || payload.businessCode !== businessCodeHeader) {
      return res.status(403).json({ error: 'Token not authorized for this business code' });
    }

    req.user = payload;
    req.businessCode = businessCodeHeader;
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export default authMiddleware;
