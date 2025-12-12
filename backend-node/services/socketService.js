const { Server } = require('socket.io');

class SocketService {
  constructor() {
    this.io = null;
  }

  init(server) {
    this.io = new Server(server, {
      cors: { origin: process.env.FRONTEND_URL || '*', methods: ['GET', 'POST'] },
    });

    this.io.on('connection', (socket) => {
      const tenant = socket.handshake.query.tenant;
      if (tenant) socket.join(tenant);
    });
  }

  emitAlert(tenantRoom, data) {
    if (this.io) {
      this.io.to(tenantRoom).emit('alert', data);
    }
  }
}

module.exports = new SocketService();
