const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const socketIo = require('socket.io');
const routes = require('./src/routes');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: '*' } });

app.use(cors());
app.use(helmet());
app.use(express.json());

app.use((req, res, next) => {
  req.io = io;
  next();
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/api/v1', routes);

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  server.listen(PORT, () => {
    // Keep log lightweight; this is the primary entry point.
    console.log(`API server listening on port ${PORT}`);
  });
}

module.exports = { app, server, io };
