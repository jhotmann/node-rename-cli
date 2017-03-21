#!/usr/bin/env node
const argv = require('yargs')
    .usage('rename [options] files new-file-name')
    .options({
      'h': {
        alias: 'help'
      }, 'i': {
        alias: 'info',
        boolean: true,
        describe: 'View online help'
      }, 'v': {
        alias: 'variables',
        boolean: true,
        describe: 'Display available variables'
      }, 'u': {
        alias: 'undo',
        boolean: true,
        describe: 'Undo previous rename operation'
      }, 'r': {
        describe: 'See RegEx section of online help for more information',
        type: 'string'
      }, 'f': {
        alias: 'force',
        boolean: true,
        describe: 'Force overwrite without prompt when output file name already exists'
      }, 's': {
        alias: 'sim',
        boolean: true,
        describe: 'Simulate rename and just print new file names'
      }, 'n': {
        alias: 'noindex',
        boolean: true,
        describe: 'Do not append an index when renaming multiple files'
      }
    })
    .help('help')
    .argv;
const fs = require('fs-extra');
const index = require('./index');
const opn = require('opn');
const os = require('os');

const userReplacements = os.homedir() + '/.rename/replacements.js';

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
  if (argv.v) { // print variables
    console.log('Variables:');
    console.log('');
    console.log(index.getReplacements());
    process.exit(0);
  } else if (argv.i) {
    opn('https://github.com/jhotmann/node-rename-cli');
    process.exit(0);
  } else if (argv.u) { // undo previous rename
    index.undoRename();
  } else { // proceed to index.js to do the rename
    index.thecommand(argv);
  }
}