module.exports = (sequelize, DataTypes) => {
  const Official = sequelize.define('Official', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    role: { type: DataTypes.STRING, allowNull: false },
    contact: { type: DataTypes.STRING },
    tenantId: { type: DataTypes.INTEGER },
  });

  return Official;
};
