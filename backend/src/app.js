const express = require('express');
const cors = require('cors');
const http = require('http');
require('dotenv').config();

const socketService = require('./services/socketService');

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize Socket.IO
socketService.initialize(server);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'AI Surveillance Backend' });
});

// Import routes (to be created)
// app.use('/api/auth', require('./routes/authRoutes'));
// app.use('/api/alerts', require('./routes/alertRoutes'));
// app.use('/api/cameras', require('./routes/cameraRoutes'));

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
});

module.exports = app;
