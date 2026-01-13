import express from 'express';
import tenantResolver from '../middlewares/tenantResolver.js';
import { login } from '../controllers/authController.js';

const router = express.Router();

router.post('/login', tenantResolver, login);

export default router;
