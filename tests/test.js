/* eslint-disable no-undef */
const assert = require('assert');
const fs = require('fs-extra');
const os = require('os');
const path = require('path');
const pathExists = require('path-exists');
const rename = require('../rename');
const yargs = require('yargs');
const yargsOptions = require('../lib/yargsOptions');

// remove test directory
fs.removeSync('./test');
// create test files/directories
fs.ensureDirSync('test');
fs.ensureDirSync('test/another-dir');
for (let i = 1; i < 31; i++) {
  let num = inWords(i);
  fs.writeFileSync((i < 20 ? 'test/' : 'test/another-dir/') + num.trim().replace(' ', '-') + '.txt', 'file ' + num.trim(), 'utf8');
}
let undoFile = os.homedir() + '/.rename/undo.json';
if (!pathExists.sync(undoFile)) {
  try {
    fs.ensureFileSync(undoFile);
    fs.writeJSONSync(undoFile, []);
  } catch(e) {
    console.log('Could not write ' + undoFile);
  }
}

// run tests
runTest('rename -v test/one.txt test/one-renamed.txt', 'Rename a single file', 'test/one.txt', 'test/one-renamed.txt');

runTest('rename -v test/f*.txt test/multiple',
  'Rename multiple files the same thing with appended index',
  ['test/four.txt', 'test/five.txt', 'test/fourteen.txt', 'test/fifteen.txt'],
  ['test/multiple1.txt', 'test/multiple2.txt', 'test/multiple3.txt', 'test/multiple4.txt']);

runTest('rename -v test/two.txt "{{p}}/{{f|upper}}.{{\'testing-stuff\'|camel}}"',
  'Rename with variables and filters', 'test/two.txt', 'test/TWO.testingStuff');

runTest('rename -v test/th* test/same --noindex -force', 'Force multiple files to be renamed the same',
  ['test/three.txt', 'test/thirteen.txt'], 'test/same.txt');

runTest('rename -v test/six* test/keep --noindex -k', 'Multiple files to be renamed the same but with keep option',
  ['test/six.txt', 'test/sixteen.txt'], ['test/keep.txt', 'test/keep-1.txt']);

runTest('rename -v test/one-renamed.txt "test/another-dir/{{os.platform}}"', 'Move a file to a new directory',
    'test/one-renamed.txt', 'test/another-dir/' + os.platform() + '.txt');

runTest('rename -v test/eight.txt "test/another-dir/{{f}}-notmoved" --nomove', 'Don\'t move a file to a new directory',
    'test/eight.txt', 'test/eight-notmoved.txt');

let now = new Date();
let month = now.getMonth() + 1;
if (month < 10) month = '0' + month;
let day = now.getDate();
if (day < 10) day = '0' + day;
runTest(`rename -v --nomove test/seven* "{{ date.current | date('YYYY-MM-DD') }}"`, 'Rename multiple files to the same name and append index',
    ['test/seven.txt', 'test/seventeen.txt'], [`test/${now.getFullYear()}-${month}-${day}1.txt`, `test/${now.getFullYear()}-${month}-${day}2.txt`]);

// HELPER FUNCTIONS

function runTest(command, description, old, expected, undo) {
  runCommand(command, undo);
  let oldFile;
  let newFile;
  if (Array.isArray(old)) {
    oldFile = old.some(f => fs.existsSync(f));
  } else {
    oldFile = fs.existsSync(old);
  }
  if (Array.isArray(expected)) {
    newFile = expected.every(f => fs.existsSync(f));
  } else {
    newFile = fs.existsSync(expected);
  }
  describe(description, function () {
    it(command, function () {
      assert.equal(oldFile, false);
      assert.equal(newFile, true);
    });
  });
}

function runCommand(command, undo) {
  undo = undo || false;
  let argv = yargs.options(yargsOptions).parse(command.replace(/^rename /, '') + (!undo ? ' --noundo' : ''));
  let newFileName = path.parse(argv._.pop());
  let files = rename.getFileArray(argv._);
  let options = rename.argvToOptions(argv);
  let operations = rename.getOperations(files, newFileName, options);
  rename.run(operations, options, false);
}

function inWords (num) {
  let a = ['','one ','two ','three ','four ', 'five ','six ','seven ','eight ','nine ','ten ','eleven ','twelve ','thirteen ','fourteen ','fifteen ','sixteen ','seventeen ','eighteen ','nineteen '];
  let b = ['', '', 'twenty','thirty','forty','fifty', 'sixty','seventy','eighty','ninety'];
  if ((num = num.toString()).length > 9) return 'overflow';
  let n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return;
  let str = '';
  str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'crore ' : '';
  str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'lakh ' : '';
  str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'thousand ' : '';
  str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'hundred ' : '';
  str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
  return str;
}
