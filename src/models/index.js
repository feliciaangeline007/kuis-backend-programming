const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const config = require('../core/config');
const logger = require('../core/logger')('app');

const db = mongoose.connection;
const dbExports = {
  db,
};

const basename = path.basename(__filename);
let modelsLoaded = false;

function buildConnectionString(connection = config.database.connection) {
  const connectionString = new URL(connection);

  if (config.database.name) {
    connectionString.pathname = `/${config.database.name}`;
  }

  return connectionString.toString();
}

function loadModels() {
  if (modelsLoaded) {
    return;
  }

  fs.readdirSync(__dirname)
    .filter(
      (file) =>
        file.indexOf('.') !== 0 && file !== basename && file.slice(-3) === '.js'
    )
    .forEach((file) => {
      // eslint-disable-next-line import/no-dynamic-require, global-require
      const model = require(path.join(__dirname, file))(mongoose);
      dbExports[model.modelName] = model;
    });

  modelsLoaded = true;
}

async function connectDatabase(connection) {
  loadModels();

  if (db.readyState === 1) {
    return db;
  }

  await mongoose.connect(buildConnectionString(connection));
  logger.info('Successfully connected to MongoDB');

  return db;
}

async function disconnectDatabase() {
  if (db.readyState === 0) {
    return;
  }

  await mongoose.disconnect();
}

loadModels();

dbExports.connectDatabase = connectDatabase;
dbExports.disconnectDatabase = disconnectDatabase;

module.exports = dbExports;
