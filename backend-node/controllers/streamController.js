const response = require('../utils/responseHandler');

exports.list = async (_req, res) => {
  return response.success(res, []);
};

exports.register = async (req, res) => {
  // Placeholder for stream registration
  return response.success(res, req.body, 201);
};
