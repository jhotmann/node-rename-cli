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