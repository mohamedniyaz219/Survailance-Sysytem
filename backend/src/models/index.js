import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/database.js';

import TenantModel from './Tenant.js';
import CameraModel from './Camera.js';
import IncidentModel from './Incident.js';

const Tenant = TenantModel(sequelize, DataTypes);
const Camera = CameraModel(sequelize, DataTypes);
const Incident = IncidentModel(sequelize, DataTypes);

// Establish associations after all models are defined.
if (Incident.associate) {
	Incident.associate({ Camera });
}

export {
	sequelize,
	Tenant,
	Camera,
	Incident,
};
