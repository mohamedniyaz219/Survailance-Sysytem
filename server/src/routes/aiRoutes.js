import express from 'express';
import tenantResolver from '../middlewares/tenantResolver.js';
import { receiveAIAlert } from '../controllers/alertSystemController.js';

const router = express.Router();

// AI needs to know which tenant (Schema) to push the alert to.
// The Python service MUST send 'x-business-code' in headers.
router.use(tenantResolver);

router.post('/detect', receiveAIAlert);

export default router;