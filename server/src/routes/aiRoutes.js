import express from 'express';
import tenantResolver from '../middlewares/tenantResolver.js';
import { receiveDetection } from '../controllers/aiController.js';

const router = express.Router();

router.use(tenantResolver);

router.post('/detect', receiveDetection);

export default router;
