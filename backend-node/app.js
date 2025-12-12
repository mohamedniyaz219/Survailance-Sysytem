const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const incidentRoutes = require('./routes/incidentRoutes');
const aiReceiver = require('./services/aiReceiver');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.post('/ai/receive', aiReceiver.receive);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/incidents', incidentRoutes);

module.exports = app;
