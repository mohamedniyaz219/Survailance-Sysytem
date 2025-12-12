const jwt = require('jsonwebtoken');

function signToken(payload, options = {}) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT secret not configured');
  return jwt.sign(payload, secret, { expiresIn: '1h', ...options });
}

function verifyToken(token) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT secret not configured');
  return jwt.verify(token, secret);
}

module.exports = { signToken, verifyToken };
