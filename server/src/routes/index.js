import express from 'express';

import authRoutes from './authRoutes.js';
import adminRoutes from './adminRoutes.js';
import officialRoutes from './officialRoutes.js';
import userRoutes from './userRoutes.js';
import aiRoutes from './aiRoutes.js';

const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'API root' });
});

router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/official', officialRoutes);
router.use('/user', userRoutes);
router.use('/ai', aiRoutes);

export default router;
