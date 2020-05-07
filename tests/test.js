/* eslint-disable no-undef */
const fs = require('fs-extra');
const rename = require('../rename');

// remove test directory
fs.removeSync('./test');
// create test files/directories
fs.ensureDirSync('test');
fs.writeFileSync('test/one.txt', 'file one', 'utf8');
fs.writeFileSync('test/two.txt', 'file two', 'utf8');
// run tests
describe('Simple Tests');
