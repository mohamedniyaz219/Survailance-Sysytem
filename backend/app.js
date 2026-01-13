import 'dotenv/config';

import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import http from 'http';
import { Server } from 'socket.io';
import routes from './src/routes/index.js';
import { initDatabase } from './config/database.js';

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

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

export async function startServer() {
  try {
    await initDatabase();
    console.log('Database connected successfully');
    server.listen(PORT, () => {
      // Keep log lightweight; this is the primary entry point.
      console.log(`API server listening on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server: database connection error', err.message);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  startServer();
}

export { app, server, io };
