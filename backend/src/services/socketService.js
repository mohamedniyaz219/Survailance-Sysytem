const { Server } = require('socket.io');

/**
 * Socket Service
 * Handles real-time alerts and notifications
 */
class SocketService {
  constructor() {
    this.io = null;
  }

  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3001',
        methods: ['GET', 'POST']
      }
    });

    this.io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      socket.on('join-tenant', (tenantId) => {
        socket.join(`tenant_${tenantId}`);
        console.log(`Socket ${socket.id} joined tenant ${tenantId}`);
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });
  }

  // Emit alert to specific tenant
  emitAlert(tenantId, alertData) {
    if (this.io) {
      this.io.to(`tenant_${tenantId}`).emit('alert', alertData);
    }
  }

  // Broadcast to all connected clients
  broadcast(event, data) {
    if (this.io) {
      this.io.emit(event, data);
    }
  }
}

module.exports = new SocketService();
