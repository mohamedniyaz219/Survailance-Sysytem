const express = require('express');

const authRoutes = require('./authRoutes');
const adminRoutes = require('./adminRoutes');
const officialRoutes = require('./officialRoutes');
const userRoutes = require('./userRoutes');
const aiRoutes = require('./aiRoutes');

const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'API root' });
});

router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/official', officialRoutes);
router.use('/user', userRoutes);
router.use('/ai', aiRoutes);

module.exports = router;
