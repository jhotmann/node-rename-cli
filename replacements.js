const path = require('path');

const replacements = {
  '{{i}}': {
    name: 'Index',
    description: 'The index of the file when renaming multiple files',
    unique: true,
    function: function(fileObj) {
      return fileObj.index;
    }
  },
  '{{f}}': {
    name: 'File name',
    description: "The original name of the file",
    unique: true,
    function: function(fileObj) {
      return fileObj.name;
    }
  },
  '{{fl}}': {
    name: 'File name lower',
    description: "The original name of the file in lower case",
    unique: true,
    function: function(fileObj) {
      return fileObj.name.toLowerCase();
    }
  },
  '{{fu}}': {
    name: 'File name upper',
    description: "The original name of the file in upper case",
    unique: true,
    function: function(fileObj) {
      return fileObj.name.toUpperCase();
    }
  },
  '{{fc}}': {
    name: 'File name camel case',
    description: "The original name of the file in camel case",
    unique: true,
    function: function(fileObj) {
      return fileObj.name.toLowerCase().replace(/(?:^\w|[A-Z]|\b\w)/g, function(letter, index) {
        return index === 0 ? letter.toLowerCase() : letter.toUpperCase();
      }).replace(/[\s\-_\.]+/g, '');
    }
  },
  '{{fp}}': {
    name: 'File name pascal case',
    description: "The original name of the file in pascal case",
    unique: true,
    function: function(fileObj) {
      return fileObj.name.toLowerCase().replace(/(?:^\w|[A-Z]|\b\w)/g, function(letter) {
        return letter.toUpperCase();
      }).replace(/[\s\-_\.]+/g, '');
    }
  },
  '{{r}}': {
    name: 'RegEx',
    description: 'The match of the RegEx pattern specified in --r="..."',
    unique: false,
    function: function(fileObj) {
      if (fileObj.regexMatch) {
        return fileObj.regexMatch[0];
      } else {
        return '';
      }
    }
  },
  '{{p}}': {
    name: 'Parent directory',
    description: "The name of the parent directory",
    unique: false,
    function: function(fileObj) {
      return path.basename(fileObj.dir);
    }
  },
  '{{y}}': {
    name: 'Year',
    description: "The current year",
    unique: false,
    function: function() {
      let d = new Date();
      return d.getFullYear();
    }
  },
  '{{m}}': {
    name: 'Month',
    description: "The current month",
    unique: false,
    function: function() {
      let d = new Date();
      let month = d.getMonth() + 1;
      return (month < 10 ? '0' + month : month);
    }
  },
  '{{d}}': {
    name: 'Day',
    description: "The current day",
    unique: false,
    function: function() {
      let d = new Date();
      let day = d.getDate();
      return (day < 10 ? '0' + day : day);
    }
  },
  '{{g}}': {
    name: 'GUID',
    description: "A globally unique identifier",
    unique: true,
    function: function() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random()*16|0, v = c === 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
      });
    }
  }
};

module.exports = replacements;