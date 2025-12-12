module.exports = (sequelize, DataTypes) => {
  const Camera = sequelize.define('Camera', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    streamUrl: { type: DataTypes.STRING, allowNull: false },
    hlsUrl: { type: DataTypes.STRING },
    tenantId: { type: DataTypes.INTEGER },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  });

  return Camera;
};
