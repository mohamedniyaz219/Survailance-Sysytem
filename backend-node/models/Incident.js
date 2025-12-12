module.exports = (sequelize, DataTypes) => {
  const Incident = sequelize.define('Incident', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    type: { type: DataTypes.STRING, allowNull: false },
    severity: { type: DataTypes.STRING, defaultValue: 'medium' },
    metadata: { type: DataTypes.JSONB },
    cameraId: { type: DataTypes.INTEGER },
    tenantId: { type: DataTypes.INTEGER },
    occurredAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  });

  return Incident;
};
