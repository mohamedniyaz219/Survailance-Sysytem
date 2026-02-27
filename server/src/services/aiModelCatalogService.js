import fs from 'fs';
import path from 'path';

const MODEL_EXTENSIONS = new Set(['.pt', '.onnx', '.engine', '.tflite']);

function modelKey(name, version) {
  return `${String(name || '').toLowerCase()}::${String(version || '').toLowerCase()}`;
}

function parseModelMeta(fileName) {
  const ext = path.extname(fileName).toLowerCase();
  const baseName = fileName.slice(0, fileName.length - ext.length);

  const versionMatch = baseName.match(/(v\d+(?:\.\d+)*)$/i);
  const version = versionMatch ? versionMatch[1] : 'v1.0';
  const nameWithoutVersion = versionMatch
    ? baseName.slice(0, versionMatch.index)
    : baseName;

  const formattedName = nameWithoutVersion
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (ch) => ch.toUpperCase());

  return {
    name: formattedName || baseName,
    version
  };
}

function resolveAiEngineDir() {
  if (process.env.AI_ENGINE_DIR) {
    return path.resolve(process.env.AI_ENGINE_DIR);
  }
  return path.resolve(process.cwd(), '..', 'ai-engine-python');
}

function listModelFilesFromDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    return [];
  }

  return fs
    .readdirSync(dirPath, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((fileName) => MODEL_EXTENSIONS.has(path.extname(fileName).toLowerCase()))
    .map((fileName) => ({
      fileName,
      absolutePath: path.join(dirPath, fileName)
    }));
}

export function discoverAvailableModels() {
  const aiEngineDir = resolveAiEngineDir();
  const weightsDir = path.join(aiEngineDir, 'weights');

  const rootFiles = listModelFilesFromDir(aiEngineDir);
  const weightFiles = listModelFilesFromDir(weightsDir);

  const byKey = new Map();
  [...rootFiles, ...weightFiles].forEach((fileItem) => {
    const { name, version } = parseModelMeta(fileItem.fileName);
    const key = `${name.toLowerCase()}::${version.toLowerCase()}`;

    if (!byKey.has(key)) {
      byKey.set(key, {
        name,
        version,
        accuracy_score: null,
        is_active: false
      });
    }
  });

  return Array.from(byKey.values());
}

export async function syncModelsForSchema({ AIModel, schema, transaction }) {
  const tenantAIModel = AIModel.schema(schema);
  const discovered = discoverAvailableModels();
  const existing = await tenantAIModel.findAll({
    attributes: ['id', 'name', 'version', 'is_active'],
    transaction
  });

  const existingByKey = new Map(existing.map((item) => [modelKey(item.name, item.version), item]));
  const discoveredByKey = new Map(discovered.map((item) => [modelKey(item.name, item.version), item]));

  const toCreate = [];
  const toDeleteIds = [];
  const toUpdate = [];

  for (const catalogModel of discovered) {
    const key = modelKey(catalogModel.name, catalogModel.version);
    const dbModel = existingByKey.get(key);

    if (!dbModel) {
      toCreate.push(catalogModel);
      continue;
    }

    if (dbModel.name !== catalogModel.name || String(dbModel.version || '') !== String(catalogModel.version || '')) {
      toUpdate.push({
        model: dbModel,
        name: catalogModel.name,
        version: catalogModel.version
      });
    }
  }

  for (const dbModel of existing) {
    const key = modelKey(dbModel.name, dbModel.version);
    if (!discoveredByKey.has(key)) {
      toDeleteIds.push(dbModel.id);
    }
  }

  if (toCreate.length) {
    await tenantAIModel.bulkCreate(toCreate, { transaction });
  }

  for (const item of toUpdate) {
    item.model.name = item.name;
    item.model.version = item.version;
    await item.model.save({ transaction });
  }

  if (toDeleteIds.length) {
    await tenantAIModel.destroy({
      where: { id: toDeleteIds },
      transaction
    });
  }

  const hasActive = await tenantAIModel.count({
    where: { is_active: true },
    transaction
  });

  if (!hasActive) {
    const fallback = await tenantAIModel.findOne({
      order: [['createdAt', 'DESC']],
      transaction
    });

    if (fallback) {
      fallback.is_active = true;
      await fallback.save({ transaction });
    }
  }

  return {
    inserted: toCreate.length,
    updated: toUpdate.length,
    deleted: toDeleteIds.length,
    discovered: discovered.length
  };
}

export async function seedModelsForSchema(args) {
  return syncModelsForSchema(args);
}
