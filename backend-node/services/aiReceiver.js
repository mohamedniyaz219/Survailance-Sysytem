const response = require('../utils/responseHandler');
const socketService = require('./socketService');

exports.receive = async (req, res) => {
  try {
    const alert = req.body;
    socketService.emitAlert(alert.tenantId || 'public', alert);
    return response.success(res, { received: true });
  } catch (err) {
    console.error(err);
    return response.error(res, 'Failed to process alert');
  }
};
