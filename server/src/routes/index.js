import express from 'express';

// Import Route Files
import authRoutes from './authRoutes.js';
import adminRoutes from './adminRoutes.js';
import officialRoutes from './officialRoutes.js';
import userRoutes from './userRoutes.js';
import aiRoutes from './aiRoutes.js';
import { getAllActiveCameras } from '../controllers/internalController.js';

const router = express.Router();

// Root Health Check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', version: '1.0.0' });
});

// 1. Authentication (Login & Register)
router.use('/auth', authRoutes);

// 2. Admin Dashboard (Protected)
router.use('/admin', adminRoutes);

// 3. Official App (Responder)
router.use('/official', officialRoutes);

// 4. User App (Citizen Reporting)
router.use('/user', userRoutes);

// 5. AI Service Webhook
router.use('/ai', aiRoutes);

router.get('/internal/cameras', getAllActiveCameras);

export default router;