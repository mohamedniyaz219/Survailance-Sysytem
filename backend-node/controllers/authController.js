const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Tenant, User } = require('../models');
const response = require('../utils/responseHandler');

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, role: user.role, businessCode: user.businessCode },
    process.env.JWT_SECRET || 'change_me',
    { expiresIn: '12h' }
  );
};

exports.login = async (req, res) => {
  try {
    const { email, password, businessCode } = req.body;
    if (!email || !password || !businessCode) {
      return response.error(res, 'Missing credentials', 400);
    }

    const tenant = await Tenant.findOne({ where: { businessCode } });
    if (!tenant) {
      return response.error(res, 'Invalid business code', 404);
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return response.error(res, 'Invalid credentials', 401);
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash || '');
    if (!validPassword) {
      return response.error(res, 'Invalid credentials', 401);
    }

    const token = generateToken({ ...user.toJSON(), businessCode });
    return response.success(res, { token, tenant: tenant.schemaName });
  } catch (err) {
    console.error(err);
    return response.error(res, 'Login failed');
  }
};
