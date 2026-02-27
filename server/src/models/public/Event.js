import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
  class Event extends Model {}

  Event.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      business_code: { type: DataTypes.STRING, allowNull: false },
      title: { type: DataTypes.STRING, allowNull: false },
      description: { type: DataTypes.TEXT },
      event_type: { type: DataTypes.STRING },
      location_name: { type: DataTypes.STRING },
      start_at: { type: DataTypes.DATE, allowNull: false },
      end_at: { type: DataTypes.DATE },
      status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'planned' },
      is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      metadata: { type: DataTypes.JSONB }
    },
    {
      sequelize,
      modelName: 'Event',
      schema: 'public',
      tableName: 'events',
      timestamps: true
    }
  );

  return Event;
};
