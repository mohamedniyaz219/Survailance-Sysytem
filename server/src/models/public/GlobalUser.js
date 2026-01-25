import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
  class GlobalUser extends Model {}

  GlobalUser.init({
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    phone: { type: DataTypes.STRING, unique: true, allowNull: false },
    name: { type: DataTypes.STRING },
    home_city: { type: DataTypes.STRING },
    blood_group: { type: DataTypes.STRING(5) },
    emergency_contact: { type: DataTypes.STRING(20) },
    
    // PGVector: For Face ID matching
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