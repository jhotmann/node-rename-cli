const path = require('path');
// These are some helpful libraries already included in rename-cli
// All the built-in nodejs libraries are also available
// const exif = require('jpeg-exif'); // https://github.com/zhso/jpeg-exif
// const fs = require('fs-extra'); // https://github.com/jprichardson/node-fs-extra
// const n2f = require('num2fraction'); // https://github.com/yisibl/num2fraction
// const moment = require('moment'); // https://momentjs.com/

module.exports.UserData = class UserData {
  constructor(input, options) {
    this.options = options;
    this.parsedPath = path.parse(input);
  }

  async get() {
    let returnData = {};
    // Put your code here to add properties to returnData
    // this data will then be available in your output file name
    // for example: returnData.myName = 'Your Name Here';
    // or: returnData.backupDir = 'D:/backup';
    return returnData;
  }

  getDescriptions() {
    let returnDescriptions = {};
    // To describe a variable and have it show when printing help information
    // add the same path to the returnDescriptions object with a string description
    // for example: returnData.myName = 'My full name';
    // or: returnData.backupDir = 'The path to my backup directory';
    return returnDescriptions;
  }
};