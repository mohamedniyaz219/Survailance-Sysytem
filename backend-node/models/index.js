const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/config');

const Tenant = require('./Tenant')(sequelize, DataTypes);
const User = require('./User')(sequelize, DataTypes);
const Incident = require('./Incident')(sequelize, DataTypes);
const Camera = require('./Camera')(sequelize, DataTypes);
const Official = require('./Official')(sequelize, DataTypes);

// Associations
Tenant.hasMany(User, { foreignKey: 'tenantId' });
User.belongsTo(Tenant, { foreignKey: 'tenantId' });

Tenant.hasMany(Camera, { foreignKey: 'tenantId' });
Camera.belongsTo(Tenant, { foreignKey: 'tenantId' });

Tenant.hasMany(Incident, { foreignKey: 'tenantId' });
Incident.belongsTo(Tenant, { foreignKey: 'tenantId' });

Tenant.hasMany(Official, { foreignKey: 'tenantId' });
Official.belongsTo(Tenant, { foreignKey: 'tenantId' });

module.exports = {
  sequelize,
  Tenant,
  User,
  Incident,
  Camera,
  Official,
};
