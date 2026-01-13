export default (sequelize, DataTypes) => {
	const Tenant = sequelize.define('Tenant', {
		id: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true,
		},
		name: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		business_code: {
			type: DataTypes.STRING,
			allowNull: false,
			unique: true,
		},
		schema_name: {
			type: DataTypes.STRING,
			allowNull: false,
			unique: true,
		},
	}, {
		tableName: 'tenants',
		underscored: true,
	});

	return Tenant;
};
