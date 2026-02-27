import express from 'express';
import authMiddleware from '../middlewares/authMiddleware.js';
import tenantResolver from '../middlewares/tenantResolver.js';
import { getMyAlerts, updateStatus, getNavigation } from '../controllers/responderController.js';
import { listAvailableEvents } from '../controllers/eventController.js';

const router = express.Router();

router.use(authMiddleware, tenantResolver);

router.get('/alerts', getMyAlerts);
router.patch('/alerts/:id/status', updateStatus);
router.get('/alerts/:id/navigation', getNavigation);
router.get('/events', listAvailableEvents);

export default router;
