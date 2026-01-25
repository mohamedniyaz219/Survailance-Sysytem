import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Sequelize, DataTypes } from 'sequelize';
import process from 'process';

// Import the configuration from the config.js file at the project root
import configObj from '../../config/config.js'; 

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const env = process.env.NODE_ENV || 'development';
const dbConfig = configObj[env];
const db = {};

let sequelize;
if (dbConfig.use_env_variable) {
  sequelize = new Sequelize(process.env[dbConfig.use_env_variable], dbConfig);
} else {
  sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, dbConfig);
}

// Helper to load models from a specific directory dynamically
const loadModelsFromDir = async (dirPath) => {
  const files = fs.readdirSync(dirPath).filter(file => {
    return (
      file.indexOf('.') !== 0 && 
      file !== 'index.js' && 
      file.slice(-3) === '.js'
    );
  });

  for (const file of files) {
    const modelPath = path.join(dirPath, file);
    const modelDef = await import(modelPath);
    const model = modelDef.default(sequelize, DataTypes);
    db[model.name] = model;
  }
};

// 1. Load Public Models
await loadModelsFromDir(path.join(__dirname, 'public'));

// 2. Load Tenant Models
await loadModelsFromDir(path.join(__dirname, 'tenant'));

// 3. Setup Associations
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

export default db;