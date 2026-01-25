import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
  class Camera extends Model {}

  Camera.init({
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING },
    rtsp_url: { type: DataTypes.TEXT, allowNull: false },
    location: { type: DataTypes.GEOMETRY('POINT'), allowNull: false },
    location_name: { type: DataTypes.STRING },
    zone: { type: DataTypes.STRING },
    status: { 
      type: DataTypes.ENUM('online', 'offline', 'maintenance'), 
      defaultValue: 'online' 
    }
  }, {
    sequelize,
    modelName: 'Camera',
    tableName: 'cameras',
    timestamps: true
  });

  return Camera;
};