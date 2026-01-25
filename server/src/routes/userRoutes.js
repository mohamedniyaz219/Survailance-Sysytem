import express from 'express';
import tenantResolver from '../middlewares/tenantResolver.js';
import { reportIncident } from '../controllers/userController.js';

const router = express.Router();

router.use(tenantResolver);

router.post('/report', reportIncident);

export default router;
