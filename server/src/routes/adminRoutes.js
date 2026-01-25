import express from 'express';
import authMiddleware from '../middlewares/authMiddleware.js';
import tenantResolver from '../middlewares/tenantResolver.js';
import { addCamera, getAnalytics, manageOfficials, liveFeed } from '../controllers/adminController.js';

const router = express.Router();

router.use(authMiddleware, tenantResolver);

router.post('/cameras', addCamera);
router.get('/analytics', getAnalytics);
router.post('/officials', manageOfficials);
router.delete('/officials/:id', manageOfficials);
router.get('/live-feed/:cameraId', liveFeed);

export default router;
