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

const chalk = require('chalk');
const fs = require('fs-extra');
const rename = require('./rename');
const opn = require('opn');
const os = require('os');
const path = require('path');
const prompt = require('prompt-sync')();
const yargs = require('yargs');

const argv = yargs
    .usage('Rename-CLI v' + require('./package.json').version + '\n\nUsage:\n\n  rename [options] file(s) new-file-name')
    .options(require('./lib/yargsOptions'))
    .help('help')
    .epilogue('Variables:\n\n' + rename.getReplacementsList())
    .wrap(yargs.terminalWidth())
    .argv;

const userReplacements = os.homedir() + '/.rename/replacements.js';
const compiled = (argv['$0'] && argv['$0'].indexOf('rname.exe') > -1);

// check if ~/.rename/replacements.js exists, if not create it and
// then copy in the text from ./userReplacements.js
fs.ensureFile(userReplacements, err => {
  if (err) throw err;
  fs.readFile(userReplacements, 'utf8', (er, data) => {
    if (er) throw er;
    if (data === '') {
      fs.readFile(__dirname + '/lib/userReplacements.js', 'utf8', (ex, usrRep) => {
        if (ex) throw ex;
        fs.writeFile(userReplacements, usrRep, (e) => {
          if (e) throw e;
          parseArgs();
        });
      });
    } else {
      parseArgs();
    }
  });
});

function parseArgs() {
  if (argv.i) { // view online hlep
    opn('https://github.com/jhotmann/node-rename-cli');
    if (process.platform !== 'win32') {
      process.exit(0);
    }
  } else if (argv.u) { // undo previous rename
    rename.undoRename();
  } else if (argv.w) { // launch the wizard
    require('./lib/wizard')();
  } else if (argv._.length > 1) { // proceed to do the rename
    renameFiles();
  } else if (argv._.length === 0 && !compiled) {
    require('./lib/ui');
  } else {
    console.log('ERROR: Not enough arguments specified. Type rename -h for help');
    process.exit(1);
  }
}

function renameFiles() {
  let newFileName = path.parse(argv._.pop());
  let files = rename.getFileArray(argv._).map(f => { return f.replace(/\\\[/g, '[').replace(/\\\]/g, ']'); });
  let options = rename.argvToOptions(argv);
  let operations = rename.getOperations(files, newFileName, options);
  let hasConflicts = rename.hasConflicts(operations);
  
  // Warn if any replacement variables are being depreciated
  let depreciationMessages = [];
  operations.filter(o => { return o.depreciationMessages; }).forEach(o => { o.depreciationMessages.forEach(m => { if (depreciationMessages.indexOf(m) === -1) depreciationMessages.push(m); }); });
  if (depreciationMessages && depreciationMessages.length > 0) depreciationMessages.forEach(m => { console.log(chalk.yellow(m)); });
  
  // Print off renames if simulated, prompt, or verbose options used, or warn if there are file
  // conflicts and the force option isn't used.
  if (options.simulate || options.prompt || options.verbose || (!options.force && !options.keep && hasConflicts)) {
    let conflicts = false;
    let existing = false;
    let missingDirectories = false;
    console.log('');
    if (operations.length === 0 && options.verbose) {
      console.log('No rename operations to execute');
    }
    operations.forEach(function(value) {
      if (value.alreadyExists) {
        console.log(chalk.red(value.text));
        existing = true;
      } else if (value.conflict) {
        console.log(chalk.yellow(value.text));
        conflicts = true;
      } else if (!value.directoryExists) {
        console.log(chalk.red(value.text));
        missingDirectories = true;
      } else {
        console.log(value.text);
      }
    });
    if (existing || conflicts || missingDirectories) {
      console.log('');
    }
    if (existing) {
      console.log(chalk.red('WARNING: File(s) already exist'));
      if (!options.simulate && !options.force) {
        console.log('');
      }
    }
    if (conflicts) {
      console.log(chalk.yellow('WARNING: There are conflicting output file name(s)'));
      if (!options.simulate && !options.force) {
        console.log('');
      }
    }
    if (missingDirectories) {
      console.log(chalk.red('WARNING: The directory doesn\'t exist'));
      if (!options.simulate && !options.force) {
        console.log('');
      }
    }
    if (!options.simulate && (existing || conflicts || options.verbose || options.prompt)) {
      if (!hasConflicts) {
        console.log('');
      }
      let conflictPrompt = prompt('Would you like to proceed? (y/n) ');
      if (conflictPrompt === 'y') {
        rename.run(operations, options);
      }
    }
  } else {
    rename.run(operations, options);
  }
}