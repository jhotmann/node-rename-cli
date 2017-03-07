#!/usr/bin/env node
const argv = require('minimist')(process.argv.slice(2), {boolean: true});
const fs = require('fs-extra');
const index = require('./index');
const os = require('os');
const packagejson = require('./package.json');

const userReplacements = os.homedir() + '/.rename/replacements.js';
const commandName = Object.keys(packagejson.bin)[0];

// check if ~/.rename/replacements.js exists, if not create it and
// then copy in the text from ./userReplacements.js
fs.ensureFile(userReplacements, err => {
  if (err) throw err;
  fs.readFile(userReplacements, 'utf8', (er, data) => {
    if (er) throw er;
    if (data === '') {
      fs.readFile(__dirname + '/userReplacements.js', 'utf8', (ex, usrRep) => {
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
  if (argv.help || argv.h) { // display help text
    let help1 = fs.readFileSync(__dirname + '/help1.txt', 'utf8');
    let help2 = fs.readFileSync(__dirname + '/help2.txt', 'utf8');
    console.log(help1);
    index.getReplacements();
    console.log(help2);
    process.exit(0);
  } else if (argv.v) { // print version number
    console.log(packagejson.version);
    console.log('');
    process.exit(0);
  } else if (argv.u) { // undo previous rename
    index.undoRename();
  } else { // proceed to index.js to do the rename
    index.thecommand(argv);
  }
}