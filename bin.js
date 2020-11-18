#!/usr/bin/env node
// Handle EPIPE errors when user doesn't put quotes around output file name with parameters
function epipeError(err) {
  if (err.code === 'EPIPE' || err.errno === 32) return process.exit;
  if (process.stdout.listeners('error').length <= 1) {
    process.stdout.removeAllListeners();
    process.stdout.emit('error', err);
    process.stdout.on('error', epipeError);
  }
}
process.stdout.on('error', epipeError);

const async = require('async');
const chalk = require('chalk');
const fs = require('fs-extra');
const opn = require('opn');
const os = require('os');
const yargs = require('yargs');

const database = require('./src/database');
const util = require('./src/util');

(async () => {
  // create ~/.rename/userData.js if not exist
  const userDataPath = os.homedir() + '/.rename/userData.js';
  await fs.ensureFile(userDataPath).catch(err => { throw err; });
  const userDataContents = await fs.readFile(userDataPath, 'utf8').catch(err => { throw err; });
  if (userDataContents === '') {
    await fs.copyFile(__dirname + '/lib/userData.js', userDataPath);
  }
  // create ~/.rename/userFilters.js if not exist
  const userFiltersPath = os.homedir() + '/.rename/userFilters.js';
  await fs.ensureFile(userFiltersPath).catch(err => { throw err; });
  const userFiltersContents = await fs.readFile(userFiltersPath, 'utf8').catch(err => { throw err; });
  if (userFiltersContents === '') {
    await fs.copyFile(__dirname + '/lib/userFilters.js', userFiltersPath);
  }
  // SQLite database setup
  const sequelize = await database.init();

  const { Operation } = require('./src/operation');
  const { Options } = require('./src/options');
  const { Batch } = require('./src/batch');

  // Parse command line arguments
  const argv = yargs
      .usage('Rename-CLI v' + require('./package.json').version + '\n\nUsage:\n\n  rename [options] file(s) new-file-name')
      .options(require('./lib/yargsOptions'))
      .help('help')
      .epilogue('Variables:\n\n' + util.getVariableList())// + rename.getReplacementsList())
      .wrap(yargs.terminalWidth())
      .argv;
  
  // Turn parsed args into new Options class
  const options = new Options(argv);
  // Ensure that only input files that exist are considered
  await options.validateInputFiles();

  if (options.info) { // view online hlep
    opn('https://github.com/jhotmann/node-rename-cli');
    if (process.platform !== 'win32') {
      process.exit(0);
    }
  } else if (options.undo) { // undo previous rename
    const lastBatch = await sequelize.models.Batch.findOne({
      where: {
        undone: false
      },
      order: [[ 'createdAt', 'DESC' ]]
    });
    if (lastBatch === null) {
      console.log(chalk`{red No batches found that can be undone}`);
      process.exit(1);
    }
    const ops = await sequelize.models.Op.findAll({
      where: {
        BatchId: lastBatch.id
      }
    });
    console.log(`Undoing '${util.argvToString(JSON.parse(lastBatch.command))}' (${ops.length} operation${ops.length === 1 ? '' : 's'})`);
    async.eachSeries(ops, async (o) => {
      if (options.verbose) console.log(`${o.output.replace(process.cwd(), '')} → ${o.input.replace(process.cwd(), '')}`);
      await fs.rename(o.output, o.input);
    });
    lastBatch.undone = true;
    await lastBatch.save();
  } else if (options.wizard) { // launch the wizard
    await require('./src/wizard')(sequelize);
  } else if (options.printdata && options.inputFiles.length === 1) { // print the file's data
    let operation = new Operation(options.inputFiles[0], options, sequelize);
    operation.printData();
  } else if (options.inputFiles.length > 0 && options.outputPattern) { // proceed to do the rename
    //await rename(argv, options, sequelize);
    let batch = new Batch(argv, options, sequelize);
    await batch.complete();
  } else if (argv._.length === 0 && !options.compiled) { // launch TUI
    const ui = require('./src/tui');
    await ui(sequelize);
  } else { // Invalid command
    if (options.invalidInputFiles > 0) {
      console.log(chalk`{red ERROR: None of the input files specified exist}`);
    } else {
      console.log(chalk`{red ERROR: Not enough arguments specified. Type rename -h for help}`);
    }
    process.exit(1);
  }
})();