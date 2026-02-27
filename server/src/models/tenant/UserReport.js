import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
  class UserReport extends Model {
    static associate(models) {
      UserReport.belongsTo(models.Personnel, {
        foreignKey: 'assigned_responder_id',
        as: 'assignedResponder'
      });
    }
  }

  UserReport.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      event_id: { type: DataTypes.INTEGER, allowNull: false },
      global_user_id: { type: DataTypes.UUID, allowNull: true },
      incident_type: { type: DataTypes.STRING, allowNull: false },
      description: { type: DataTypes.TEXT },
      location_name: { type: DataTypes.STRING },
      location: { type: DataTypes.GEOMETRY('POINT'), allowNull: true },
      media_url: { type: DataTypes.TEXT },
      media_type: {
        type: DataTypes.ENUM('photo', 'video', 'unknown'),
        allowNull: false,
        defaultValue: 'unknown'
      },
      status: {
        type: DataTypes.ENUM('new', 'assigned', 'in_progress', 'resolved', 'rejected'),
        allowNull: false,
        defaultValue: 'new'
      },
      assigned_responder_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'personnel',
          key: 'id'
        }
      },
      assigned_at: { type: DataTypes.DATE, allowNull: true }
    },
    {
      sequelize,
      modelName: 'UserReport',
      tableName: 'user_reports',
      timestamps: true
    }
  );

  return UserReport;
};
