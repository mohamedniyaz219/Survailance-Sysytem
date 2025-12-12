const response = require('../utils/responseHandler');

module.exports = (req, res, next) => {
  const businessCode = req.headers['x-business-code'] || req.user?.businessCode;
  if (!businessCode) {
    return response.error(res, 'Business code required', 400);
  }

  req.tenantSchema = `tenant_${businessCode.toLowerCase()}`;
  return next();
};
