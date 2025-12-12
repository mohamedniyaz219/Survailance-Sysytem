const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const tenantResolver = require('../middlewares/tenantResolver');
const responderController = require('../controllers/responderController');

const router = express.Router();

router.use(authMiddleware, tenantResolver);

router.get('/alerts', responderController.getMyAlerts);
router.patch('/alerts/:id/status', responderController.updateStatus);
router.get('/alerts/:id/navigation', responderController.getNavigation);

module.exports = router;
