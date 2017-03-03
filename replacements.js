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
  }
};

module.exports = replacements;