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
if (!pathExists.sync(undoFile)) fs.writeJSONSync(undoFile, []);

// run tests
runCommand('rename test/one.txt test/one-renamed.txt');
let oldFile = fs.existsSync('test/one.txt');
let newFile = fs.existsSync('test/one-renamed.txt');
describe('Rename a single file', function () {
  it('rename test/one.txt test/one-renamed.txt', function () {
    assert.equal(oldFile, false);
    assert.equal(newFile, true);
  });
});

runCommand('rename test/f*.txt test/multiple');
oldFile = ['test/four.txt', 'test/five.txt', 'test/fourteen.txt', 'test/fifteen.txt'].some(f => fs.existsSync(f));
newFile = ['test/multiple1.txt', 'test/multiple2.txt', 'test/multiple3.txt', 'test/multiple4.txt'].every(f => fs.existsSync(f));
describe('Rename multiple files the same thing with appended index', function () {
  it('rename test/f*.txt test/multiple', function () {
    assert.equal(oldFile, false);
    assert.equal(newFile, true);
  });
});

// HELPER FUNCTIONS

function runCommand(command) {
  let argv = yargs.options(yargsOptions).parse(command.replace(/^rename /, ''));
  let newFileName = path.parse(argv._.pop());
  let files = rename.getFileArray(argv._);
  let options = rename.argvToOptions(argv);
  let operations = rename.getOperations(files, newFileName, options);
  rename.run(operations, false);
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
