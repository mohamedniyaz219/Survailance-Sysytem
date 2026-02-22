import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
  class GlobalUser extends Model {}

  GlobalUser.init({
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    phone: { type: DataTypes.STRING, unique: true, allowNull: false }, // Login ID
    password_hash: { type: DataTypes.STRING, allowNull: false }, // <--- ADDED
    name: { type: DataTypes.STRING },
    home_city: { type: DataTypes.STRING },
    blood_group: { type: DataTypes.STRING(5) },
    emergency_contact: { type: DataTypes.STRING(20) },
    face_vector: { type: DataTypes.ARRAY(DataTypes.FLOAT) } 
  }, {
    sequelize,
    modelName: 'GlobalUser',
    schema: 'public',
    tableName: 'global_users',
    timestamps: true
  });

  return GlobalUser;
};