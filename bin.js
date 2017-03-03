#!/usr/bin/env node
const packagejson = require('./package.json');
const argv = require('minimist')(process.argv.slice(2), {boolean: true});
const index = require('./index');
const commandName = Object.keys(packagejson.bin)[0];

if (argv.help || argv.h) {
  console.log('');
  console.log('Rename a file or multiple files with optional variable replacement.');
  console.log('');
  console.log('Usage: %s [options] files new-file-name', commandName);
  console.log(' If you rename multiple files at once, an index will be appended');
  console.log(' to the end of the file unless otherwise specified with {{i}}, or');
  console.log(' the original file name is used via {{f}}.');
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
} else {
  index.thecommand(argv);
}