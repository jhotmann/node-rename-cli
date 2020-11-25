// These are some helpful libraries already included in rename-cli
// All the built-in nodejs libraries are also available
// const exif = require('jpeg-exif'); // https://github.com/zhso/jpeg-exif
// const fs = require('fs-extra'); // https://github.com/jprichardson/node-fs-extra
// const n2f = require('num2fraction'); // https://github.com/yisibl/num2fraction
// const { format } = require('date-fns'); // https://date-fns.org/

module.exports = function(fileObj, descriptions) {
  let returnData = {};
  let returnDescriptions = {};

  // Put your code here to add properties to returnData
  // this data will then be available in your output file name
  // for example: returnData.myName = 'Your Name Here';
  // or: returnData.backupDir = 'D:/backup';

  // To describe a variable and have it show when printing help information
  // add the same path to the returnDescriptions object with a string description
  // for example: returnData.myName = 'My full name';
  // or: returnData.backupDir = 'The path to my backup directory';

  if (!descriptions) return returnData;
  else return returnDescriptions;
};