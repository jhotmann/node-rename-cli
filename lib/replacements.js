const dateFormat = require('dateformat');
const exif = require('jpeg-exif');
const fs = require('fs');
const n2f = require('num2fraction');
const path = require('path');

const replacements = {
  'i': {
    name: 'Index',
    description: 'The index of the file when renaming multiple files',
    parameters: {
      description: 'starting index, default is 1',
      default: '1'
    },
    unique: true,
    function: function(fileObj, args) {
      let newIndex = parseInt(args) - 1 + parseInt(fileObj.index);
      let totalFiles = parseInt(args) - 1 + parseInt(fileObj.totalFiles);
      return fileIndexString(totalFiles, newIndex);
    }
  },
  'f': {
    name: 'File Name',
    description: "The original name of the file",
    parameters: {
      description: 'upper, lower, camel, pascal, or none for unmodified',
      default: ''
    },
    unique: true,
    function: function(fileObj, args) {
      switch (args.toLowerCase()) {
        case 'upper':
          return fileObj.name.toUpperCase();
        case 'lower':
          return fileObj.name.toLowerCase();
        case 'camel':
          return fileObj.name.toLowerCase().replace(/(?:^\w|[A-Z]|\b\w)/g, function(letter, index) {
            return index === 0 ? letter.toLowerCase() : letter.toUpperCase();
          }).replace(/[\s\-_\.]+/g, '');
        case 'pascal':
          return fileObj.name.toLowerCase().replace(/(?:^\w|[A-Z]|\b\w)/g, function(letter) {
            return letter.toUpperCase();
          }).replace(/[\s\-_\.]+/g, '');
        default:
          return fileObj.name;
      }
    }
  },
  'r': {
    name: 'RegEx',
    description: 'The specified match of the RegEx pattern(s) specified in -r "..."',
    parameters: {
      description: 'the number of the regex match, default is 0',
      default: '0'
    },
    unique: false,
    function: function(fileObj, arg) {
      let matchNum = parseInt(arg);
      if (fileObj.regexMatches && fileObj.regexMatches[matchNum]) {
        return fileObj.regexMatches[matchNum];
      } else {
        return '';
      }
    }
  },
  'ra': {
    name: 'RegEx All',
    description: 'All matches of the RegEx pattern specified in -r "..."',
    parameters: {
      description: 'separator character(s), default is none',
      default: ''
    },
    unique: false,
    function: function(fileObj, args) {
      if (fileObj.regexMatches) {
        args = (args ? args : '');
        return fileObj.regexMatches.join(args);
      } else {
        return '';
      }
    }
  },
  'rn': {
    name: 'RegEx Not',
    description: 'Everything except for the matches of the RegEx pattern specified in -r "..."',
    parameters: {
      description: 'replacement character(s), default is none',
      default: ''
    },
    unique: false,
    function: function(fileObj, args) {
      args = (args ? args : '');
      let output = fileObj.name;
      fileObj.regexPatterns.forEach((pattern) => { output = output.replace(pattern, args); });
      return output;
    }
  },
  'p': {
    name: 'Parent Directory',
    description: "The name of the parent directory",
    parameters: {
      description: 'upper, lower, camel, pascal, or none for unmodified',
      default: ''
    },
    unique: false,
    function: function(fileObj, args) {
      let parentDir =  path.basename(fileObj.dir);
      switch (args.toLowerCase()) {
        case 'upper':
          return parentDir.toUpperCase();
        case 'lower':
          return parentDir.toLowerCase();
        case 'camel':
          return parentDir.toLowerCase().replace(/(?:^\w|[A-Z]|\b\w)/g, function(letter, index) {
            return index === 0 ? letter.toLowerCase() : letter.toUpperCase();
          }).replace(/[\s\-_\.]+/g, '');
        case 'pascal':
          return parentDir.toLowerCase().replace(/(?:^\w|[A-Z]|\b\w)/g, function(letter) {
            return letter.toUpperCase();
          }).replace(/[\s\-_\.]+/g, '');
        default:
          return parentDir;
      }
    }
  },
  'd': {
    name: 'Date',
    description: "The current date/time",
    parameters: {
      description: 'date format, default is yyyymmdd',
      default: 'yyyymmdd'
    },
    unique: false,
    function: function(fileObj, args) {
      let d = new Date();
      return dateFormat(d, args);
    }
  },
  'cd': {
    name: 'Create Date',
    description: "The date/time the file was created",
    parameters: {
      description: 'date format, default is yyyymmdd',
      default: 'yyyymmdd'
    },
    unique: false,
    function: function(fileObj, args) {
      let stats = fs.statSync(fileObj.dir + '/' + fileObj.base);
      return dateFormat(stats.ctime, args);
    }
  },
  'md': {
    name: 'Modified Date',
    description: "The date/time the file was modified",
    parameters: {
      description: 'date format, default is yyyymmdd',
      default: 'yyyymmdd'
    },
    unique: false,
    function: function(fileObj, args) {
      let stats = fs.statSync(fileObj.dir + '/' + fileObj.base);
      return dateFormat(stats.mtime, args);
    }
  },
  'ad': {
    name: 'Accessed Date',
    description: "The date/time the file was accessed",
    parameters: {
      description: 'date format, default is yyyymmdd',
      default: 'yyyymmdd'
    },
    unique: false,
    function: function(fileObj, args) {
      let stats = fs.statSync(fileObj.dir + '/' + fileObj.base);
      return dateFormat(stats.atime, args);
    }
  },
  'g': {
    name: 'GUID',
    description: "A globally unique identifier",
    parameters: {
      description: 'pattern using x\'s which will be replaced as random 16bit characters and y\'s which will be replaced with a, b, 8, or 9. Default is xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx',
      default: 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'
    },
    unique: true,
    function: function(fileObj, args) {
      args = (args ? args : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx');
      return args.replace(/[xy]/g, function(c) {
        var r = Math.random()*16|0, v = c === 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
      });
    }
  },
  'eiso': {
    name: 'Exif ISO',
    description: "Photo ISO value",
    unique: false,
    function: function(fileObj) {
      let data = getExifData(fileObj.dir + '/' + fileObj.base);
      return (typeof(data) === 'object' && data.SubExif && data.SubExif.PhotographicSensitivity ? data.SubExif.PhotographicSensitivity : '');
    }
  },
  'efnum': {
    name: 'Exif FNumber',
    description: "Photo FNumber value",
    unique: false,
    function: function(fileObj) {
      let data = getExifData(fileObj.dir + '/' + fileObj.base);
      return (typeof(data) === 'object' && data.SubExif && data.SubExif.FNumber ? data.SubExif.FNumber[0] : '');
    }
  },
  'eex': {
    name: 'Exif Exposure Time',
    description: "Photo exposure time value",
    unique: false,
    function: function(fileObj) {
      let data = getExifData(fileObj.dir + '/' + fileObj.base);
      if (typeof(data) === 'object' && data.SubExif && data.SubExif.ExposureTime) {
        if (data.SubExif.ExposureTime[0] < 1) {
          return n2f(data.SubExif.ExposureTime[0]).replace('/', '-');
        } else {
          return data.SubExif.ExposureTime[0];
        }
      } else {
        return '';
      }
    }
  },
  'ed': {
    name: 'Exif Date',
    description: "The date/time photo was taken",
    parameters: {
      description: 'date format, default is yyyymmdd',
      default: 'yyyymmdd'
    },
    unique: false,
    function: function(fileObj, args) {
      let data = getExifData(fileObj.dir + '/' + fileObj.base);
      let formattedDate = data.DateTime.split(/:|\s/)[1] + '/' + data.DateTime.split(/:|\s/)[2] + '/' + data.DateTime.split(/:|\s/)[0] + ' ' + data.DateTime.split(/:|\s/)[3] + ':' + data.DateTime.split(/:|\s/)[4] + ':' + data.DateTime.split(/:|\s/)[5];
      return (typeof(data) === 'object' && data.DateTime ? dateFormat(formattedDate, args) : '');
    }
  },
  'eh': {
    name: 'Exif Height',
    description: "The height in pixels of the photo",
    unique: false,
    function: function(fileObj) {
      let data = getExifData(fileObj.dir + '/' + fileObj.base);
      return (typeof(data) === 'object' && data.SubExif && data.SubExif.PixelYDimension ? data.SubExif.PixelYDimension : '');
    }
  },
  'ew': {
    name: 'Exif Width',
    description: "The width in pixels of the photo",
    unique: false,
    function: function(fileObj) {
      let data = getExifData(fileObj.dir + '/' + fileObj.base);
      return (typeof(data) === 'object' && data.SubExif && data.SubExif.PixelXDimension ? data.SubExif.PixelXDimension : '');
    }
  }
};

function getExifData(file) {
  try {
    let data = exif.parseSync(file);
    return data;
  } catch (ex) {
    return '';
  }
}

function fileIndexString(total, index) { // append correct number of zeroes depending on total number of files
  let totString = '' + total;
  let returnString = '' + index;
  while (returnString.length < totString.length) {
    returnString = '0' + returnString;
  }
  return returnString;
}

module.exports = replacements;