const fs = require('fs-extra');
const os = require('os');
const path = require('path');
const { Sequelize, DataTypes } = require('sequelize');

module.exports.init = async function() {
  let sequelize = await dbInit(path.join(os.homedir(), '.rename', 'rename.db'));
  return sequelize;
};

module.exports.initTest = async function() {
  let sequelize = await dbInit(path.join(os.homedir(), '.rename', 'test.db'));
  return sequelize;
};

async function dbInit(dbPath) {
  let sequelize = new Sequelize({ dialect: 'sqlite', storage: dbPath, logging: false });
  const Batch = await require('../model/batch')(sequelize, DataTypes);
  const Op = await require('../model/operation')(sequelize, DataTypes);
  await require('../model/favorites')(sequelize, DataTypes);
  await Batch.hasMany(Op);
  await Op.belongsTo(Batch);
  const dbFileExists = await fs.pathExists(dbPath);
  if (!dbFileExists) {
    await sequelize.sync({ alter: true });
  }
  return sequelize;
}