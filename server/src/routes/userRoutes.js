import express from 'express';
import citizenAuthMiddleware from '../middlewares/citizenAuthMiddleware.js';
import upload from '../middlewares/uploadMiddleware.js';
import {
	listPublicEvents,
	reportIncident,
	uploadUserMedia,
} from '../controllers/userController.js';
import { createUserReport } from '../controllers/userReportController.js';

const router = express.Router();

router.use(citizenAuthMiddleware);

router.post('/upload-media', upload.single('media'), uploadUserMedia);

router.post('/report', reportIncident);
router.post('/reports', createUserReport);
router.get('/events', listPublicEvents);

export default router;
