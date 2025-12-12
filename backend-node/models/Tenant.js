module.exports = (sequelize, DataTypes) => {
  const Tenant = sequelize.define('Tenant', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    businessCode: { type: DataTypes.STRING, allowNull: false, unique: true },
    schemaName: { type: DataTypes.STRING, allowNull: false },
  });

  return Tenant;
};
