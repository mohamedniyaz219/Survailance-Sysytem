const http = require('http');
const app = require('./app');
const socketService = require('./services/socketService');
const { sequelize } = require('./models');

const PORT = process.env.PORT || 4000;

const server = http.createServer(app);
socketService.init(server);

sequelize
  .authenticate()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Backend-node running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Database connection failed:', err);
    process.exit(1);
  });
