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
      fs.readFile('./userReplacements.js', 'utf8', (ex, usrRep) => {
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
    console.log('');
    console.log('Rename a file or multiple files with optional variable replacement.');
    console.log('');
    console.log('Usage: %s [options] files new-file-name', commandName);
    console.log(' If you rename multiple files at once, an index will be appended');
    console.log(' to the end of the file unless the resulting file name will be');
    console.log(' unique. Like when using {{f}} or {{g}}.');
    console.log(' If you do not specify a file extension in the new file name, the');
    console.log(' original file extension will be used.');
    console.log('');
    console.log('Options:');
    console.log('');
    console.log(' -h, --help    Display this usage info');
    console.log(' --f           Force overwrite when output file name already exists');
    console.log(' --s           Simulate rename and just print new file names');
    console.log('');
    console.log('Available Variables:');
    console.log('');
    index.getReplacements();
    console.log('');
    console.log('Examples:');
    console.log('');
    console.log(' rename *.log {{y}}{{m}}{{d}}{{f}}');
    console.log('   node.log → 20170303node.log');
    console.log('   system.log → 20170303system.log');
    console.log('');
    console.log(' rename *.log test');
    console.log('   node.log → test1.log');
    console.log('   system.log → test2.log');
    console.log('');
    console.log('   note: index will prepend with zeros to keep file order the same');
    console.log('   when there are more than 9 files renamed.');
    console.log('');
    process.exit(0);
  } else { // proceed to index.js to do the rename
    index.thecommand(argv);
  }
}