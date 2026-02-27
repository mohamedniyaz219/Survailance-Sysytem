import express from 'express';
import authMiddleware from '../middlewares/authMiddleware.js';
import tenantResolver from '../middlewares/tenantResolver.js';

// Import Modular Controllers
import * as dashboard from '../controllers/dashboardController.js';
import * as liveWall from '../controllers/liveWallController.js';
import * as incidents from '../controllers/incidentController.js';
import * as responders from '../controllers/responderAdminController.js';
import * as mapView from '../controllers/mapViewController.js';
import * as zones from '../controllers/zoneController.js';
import * as cameras from '../controllers/cameraController.js';
import * as aiModels from '../controllers/aiModelAdminController.js';
import * as events from '../controllers/eventController.js';
import * as userReports from '../controllers/userReportController.js';
import * as anomalyRules from '../controllers/anomalyRuleController.js';
import * as crowdMetrics from '../controllers/crowdMetricsController.js';

const router = express.Router();

// All Admin routes need Auth + Tenant Context
router.use(authMiddleware, tenantResolver);

// --- Dashboard Stats ---
router.get('/stats', dashboard.getStats);
router.get('/recent', dashboard.getRecentActivity);
router.get('/dashboard-overview', dashboard.getDashboardOverview);

// --- Live Wall & Cameras ---
router.get('/live-wall', liveWall.getLiveWallOverview);
router.get('/live-wall/timeline', liveWall.getLiveWallTimeline);
router.get('/cameras', cameras.listCameras);
router.post('/cameras', cameras.createCamera);
router.patch('/cameras/:id', cameras.updateCamera);
router.delete('/cameras/:id', cameras.deleteCamera);
router.get('/cameras/:id/stream', cameras.getCameraStream);
router.get('/stream/:id', liveWall.startStream);

// --- Incident Management ---
router.get('/incidents', incidents.getAllIncidents);
router.get('/incidents/:id', incidents.getIncidentDetails);
router.post('/incidents/:id/assign', incidents.assignResponder);
router.patch('/incidents/:id/verify', incidents.verifyIncident);

// --- Map View ---
router.get('/map-overview', mapView.getMapOverview);

// --- Zones CRUD ---
router.get('/zones', zones.listZones);
router.get('/zones/options', zones.listZoneOptions);
router.post('/zones', zones.createZone);
router.patch('/zones/:id', zones.updateZone);
router.delete('/zones/:id', zones.deleteZone);

// --- Responders CRUD ---
router.get('/responders', responders.listResponders);
router.get('/responders/options', responders.listResponderOptions);
router.post('/responders', responders.createResponder);
router.patch('/responders/:id', responders.updateResponder);
router.delete('/responders/:id', responders.deleteResponder);

// --- AI Models ---
router.get('/ai-models', aiModels.listAIModels);
router.post('/ai-models/sync', aiModels.syncAvailableAIModels);
router.patch('/ai-models/:id/activate', aiModels.activateAIModel);

// --- Events (Public Schema, Tenant Scoped) ---
router.get('/events', events.listEvents);
router.post('/events', events.createEvent);
router.patch('/events/:id', events.updateEvent);
router.delete('/events/:id', events.deleteEvent);

// --- User Reports ---
router.get('/user-reports', userReports.listUserReports);
router.post('/user-reports/:id/assign', userReports.assignUserReport);

// --- Crowd Analytics ---
router.get('/crowd-metrics', crowdMetrics.listCrowdMetrics);

// --- Anomaly Rules ---
router.get('/anomaly-rules', anomalyRules.listAnomalyRules);
router.post('/anomaly-rules', anomalyRules.createAnomalyRule);
router.patch('/anomaly-rules/:id', anomalyRules.updateAnomalyRule);
router.delete('/anomaly-rules/:id', anomalyRules.deleteAnomalyRule);

export default router;