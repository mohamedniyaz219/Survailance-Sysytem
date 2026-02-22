import express from 'express';
import authMiddleware from '../middlewares/authMiddleware.js';
import tenantResolver from '../middlewares/tenantResolver.js';

// Import Modular Controllers
import * as dashboard from '../controllers/dashboardController.js';
import * as liveWall from '../controllers/liveWallController.js';
import * as incidents from '../controllers/incidentController.js';

const router = express.Router();

// All Admin routes need Auth + Tenant Context
router.use(authMiddleware, tenantResolver);

// --- Dashboard Stats ---
router.get('/stats', dashboard.getStats);
router.get('/recent', dashboard.getRecentActivity);

// --- Live Wall & Cameras ---
router.get('/cameras', liveWall.getCameras);
router.get('/stream/:id', liveWall.startStream);

// --- Incident Management ---
router.get('/incidents', incidents.getAllIncidents);
router.get('/incidents/:id', incidents.getIncidentDetails);
router.post('/incidents/:id/assign', incidents.assignResponder);

export default router;