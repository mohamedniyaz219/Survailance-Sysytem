const jwt = require('jsonwebtoken');
const response = require('../utils/responseHandler');

module.exports = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return response.error(res, 'No token provided', 401);

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'change_me');
    req.user = decoded;
    return next();
  } catch (err) {
    console.error(err);
    return response.error(res, 'Invalid token', 401);
  }
};
