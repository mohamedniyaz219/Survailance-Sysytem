const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const tenantResolver = require('../middlewares/tenantResolver');
const adminController = require('../controllers/adminController');

const router = express.Router();

router.use(authMiddleware, tenantResolver);

router.post('/cameras', adminController.addCamera);
router.get('/analytics', adminController.getAnalytics);
router.post('/officials', adminController.manageOfficials);
router.delete('/officials/:id', adminController.manageOfficials);
router.get('/live-feed/:cameraId', adminController.liveFeed);

module.exports = router;
