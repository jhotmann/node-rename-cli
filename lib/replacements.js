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
      description: 'starting index, default is 1: {{i|starting index}}',
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
      description: 'Param 1: upper, lower, camel, pascal, blank for unmodified, or replace. If replace, then Param2: search string and Param3: replace string: {{f|modifier}} or {{f|replace|search|replacement}}',
      default: ''
    },
    unique: true,
    function: function(fileObj, args) {
      let argArray = args.indexOf('||') > -1 ? args.split('||') : args.split('|');
      //switch (args.toLowerCase()) {
      switch (argArray[0].toLowerCase()) {
        case 'upper':
          return fileObj.name.toUpperCase();
        case 'lower':
          return fileObj.name.toLowerCase();
        case 'camel':
          return fileObj.name.toLowerCase().replace(/(?:^\w|[A-Z]|\b\w)/g, function(letter, index) {
            return index === 0 ? letter.toLowerCase() : letter.toUpperCase();
          }).replace(/[\s\-_.]+/g, '');
        case 'pascal':
          return fileObj.name.toLowerCase().replace(/(?:^\w|[A-Z]|\b\w)/g, function(letter) {
            return letter.toUpperCase();
          }).replace(/[\s\-_.]+/g, '');
        case 'replace': {
          printIfVerbose(fileObj, '---Replace Start---');
          let search = argArray[1] || '';
          let replace = argArray[2] || '';
          printIfVerbose(fileObj, 'search: "' + search + '"');
          printIfVerbose(fileObj, 'replace: "' + replace + '"');
          let returnString = fileObj.name;
          if (search !== '') {
            while (returnString.indexOf(search) > -1) {
              returnString = returnString.replace(search, replace);
            }
          }
          printIfVerbose(fileObj, 'returning: ' + returnString);
          printIfVerbose(fileObj, '---Replace End---');
          return returnString;
        }
        default:
          return fileObj.name;
      }
    }
  },
  'p': {
    name: 'Parent Directory',
    description: "The name of the parent directory",
    parameters: {
      description: 'Param 1: upper, lower, camel, pascal, blank for unmodified, or replace. If replace, then Param2: search string and Param3: replace string: {{p|modifier}} or {{p|replace|search|replacement}}',
      default: ''
    },
    unique: false,
    function: function(fileObj, args) {
      let parentDir =  path.basename(fileObj.dir);
      let argArray = args.indexOf('||') > -1 ? args.split('||') : args.split('|');
      //switch (args.toLowerCase()) {
      switch (argArray[0].toLowerCase()) {
        case 'upper':
          return parentDir.toUpperCase();
        case 'lower':
          return parentDir.toLowerCase();
        case 'camel':
          return parentDir.toLowerCase().replace(/(?:^\w|[A-Z]|\b\w)/g, function(letter, index) {
            return index === 0 ? letter.toLowerCase() : letter.toUpperCase();
          }).replace(/[\s\-_.]+/g, '');
        case 'pascal':
          return parentDir.toLowerCase().replace(/(?:^\w|[A-Z]|\b\w)/g, function(letter) {
            return letter.toUpperCase();
          }).replace(/[\s\-_.]+/g, '');
          case 'replace': {
            printIfVerbose(fileObj, '---Replace Start---');
            let search = argArray[1] || '';
            let replace = argArray[2] || '';
            printIfVerbose(fileObj, 'search: "' + search + '"');
            printIfVerbose(fileObj, 'replace: "' + replace + '"');
            let returnString = parentDir;
            if (search !== '') {
              while (returnString.indexOf(search) > -1) {
                returnString = returnString.replace(search, replace);
              }
            }
            printIfVerbose(fileObj, 'returning: ' + returnString);
            printIfVerbose(fileObj, '---Replace End---');
            return returnString;
          }
        default:
          return parentDir;
      }
    }
  },
  'replace': {
    name: 'Replace',
    description: 'Replace one string with another',
    parameters: {
      description: 'The string to start with, a string to search for, and a string to replace it with: {{replace|SomeStringOrVariable|search|replacement}}',
      default: ''
    },
    unique: false,
    function: function(fileObj, args) {
      printIfVerbose(fileObj, '---Replace Start---');
      let argArray = args.indexOf('||') > -1 ? args.split('||') : args.split('|');
      let theString = argArray[0] || '';
      let search = argArray[1] || '';
      let replace = argArray[2] || '';
      printIfVerbose(fileObj, 'string: "' + theString + '"');
      printIfVerbose(fileObj, 'search: "' + search + '"');
      printIfVerbose(fileObj, 'replace: "' + replace + '"');
      let returnString = theString;
      if (search !== '') {
        while (returnString.indexOf(search) > -1) {
          returnString = returnString.replace(search, replace);
        }
      }
      printIfVerbose(fileObj, 'returning: ' + returnString);
      printIfVerbose(fileObj, '---Replace End---');
      return returnString;
    }
  },
  'r': {
    name: 'RegEx',
    description: 'The specified match of the RegEx pattern(s) specified in -r',
    parameters: {
      description: 'the number of the regex match, default is 0: {{r|match number}}',
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
    description: 'All matches of the RegEx pattern specified in -r',
    parameters: {
      description: 'separator character(s), default is none: {{ra|separator}}',
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
    description: 'Everything but the matches of the RegEx pattern specified in -r',
    parameters: {
      description: 'replacement character(s), default is none: {{rn|separator}}',
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
  'regex': {
    name: 'RegEx v2',
    description: 'The match(es) of the RegEx pattern specified',
    parameters: {
      description: 'the regular expression, optional flags, and the number of the regex match or the joiner for all matches: {{regex||regular expression||flags||number or joiner}}',
      default: ''
    },
    unique: false,
    function: function(fileObj, args) {
      printIfVerbose(fileObj, '---Regex v2 Start---');
      printIfVerbose(fileObj, 'args: ' + args);
      let argArray = args.split('||');
      let regex = argArray[0];
      let flags = '';
      let numOrJoiner = '';
      let returnString = '';
      if (argArray.length === 2) {
        let arg2 = argArray[1];
        if (arg2.match(/^[gimuy]+/)) {
          flags = arg2;
        } else {
          numOrJoiner = arg2;
        }
      } else if (argArray.length > 2) {
        flags = argArray[1];
        numOrJoiner = argArray[2];
      }
      printIfVerbose(fileObj, 'regex: ' + regex);
      printIfVerbose(fileObj, 'flags: ' + flags);
      printIfVerbose(fileObj, 'numOrJoiner: ' + numOrJoiner);
      if (regex !== '') {
        let re = new RegExp(regex, flags);
        let matches = fileObj.name.match(re);
        if (matches !== null) {
          printIfVerbose(fileObj, 'matches: ' + JSON.stringify(matches));
          let matchNum = parseInt(numOrJoiner);
          if (Number.isInteger(matchNum) && matches[matchNum]) {
            printIfVerbose(fileObj, 'returning: ' + matches[matchNum]);
            returnString = matches[matchNum];
          } else {
            printIfVerbose(fileObj, 'returning: ' + matches.join(numOrJoiner));
            returnString = matches.join(numOrJoiner);
          }
        } else {
          printIfVerbose(fileObj, 'No matches found!');
        }
      } else {
        printIfVerbose(fileObj, 'Missing regular expression!');
      }
      printIfVerbose(fileObj, '---Regex v2 End---');
      return returnString;
    }
  },
  'date': {
    name: 'Dates',
    description: "Insert a date in a specific format",
    parameters: {
      description: 'the first parameter should be one of the following: c[urrent], cr[eate], m[odify], or a[ccess], and the second parameter is the date format which defaults to yyyymmdd: {{date|type|format}}',
      default: 'current|yyyymmdd'
    },
    unique: false,
    function: function(fileObj, args) {
      printIfVerbose(fileObj, '---Date Start---');
      let argArray = args.indexOf('||') > -1 ? args.split('||') : args.split('|');
      let format = argArray[1] || 'yyyymmdd';
      let returnText = '';
      switch (argArray[0].trim().toLowerCase()) {
        case 'c':
        case 'current':
        case 'c[urrent]': {
          printIfVerbose(fileObj, 'Formatting the current date to: ' + format);
          let d = new Date();
          returnText = dateFormat(d, format);
          break;
        }
        case 'cr':
        case 'create':
        case 'cr[eate]': {
          printIfVerbose(fileObj, 'Formatting ' + fileObj.base + ' create date to: ' + format);
          let stats = fs.statSync(fileObj.dir + '/' + fileObj.base);
          if (stats.birthtime) returnText = dateFormat(stats.birthtime, format);
          break;
        }
        case 'm':
        case 'modify':
        case 'm[odify]': {
          printIfVerbose(fileObj, 'Formatting ' + fileObj.base + ' modify date to: ' + format);
          let stats = fs.statSync(fileObj.dir + '/' + fileObj.base);
          if (stats.mtime) returnText = dateFormat(stats.mtime, format);
          break;
        }
        case 'a':
        case 'access':
        case 'a[ccess]': {
          printIfVerbose(fileObj, 'Formatting ' + fileObj.base + ' access date to: ' + format);
          let stats = fs.statSync(fileObj.dir + '/' + fileObj.base);
          if (stats.atime) returnText = dateFormat(stats.atime, format);
          break;
        }
      }
      printIfVerbose(fileObj, 'returning: ' + returnText);
      printIfVerbose(fileObj, '---Date End---');
      return returnText;
    }
  },
  'd': {
    name: 'Date',
    description: "The current date/time",
    deprecated: true,
    deprecationMessage: 'please use {{date|current}} instead',
    parameters: {
      description: 'date format, default is yyyymmdd: {{d|date format}}',
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
    deprecated: true,
    deprecationMessage: 'please use {{date|create}} instead',
    parameters: {
      description: 'date format, default is yyyymmdd: {{cd|date format}}',
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
    deprecated: true,
    deprecationMessage: 'please use {{date|modify}} instead',
    parameters: {
      description: 'date format, default is yyyymmdd: {{md|date format}}',
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
    deprecated: true,
    deprecationMessage: 'please use {{date|access}} instead',
    parameters: {
      description: 'date format, default is yyyymmdd: {{ad|date format}}',
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
  'exif': {
    name: 'Exif Information',
    description: "Photo Exif Information",
    parameters: {
      description: 'the first parameter should be one of the following: i[so], f[num], e[xposure], d[ate], h[eight], or w[idth]. If the first parameter is d[ate], then also include another parameter for the date format: {{exif|property|date format}}',
      default: ''
    },
    unique: false,
    function: function(fileObj, args) {
      printIfVerbose(fileObj, '---Exif Start---');
      let argArray = args.indexOf('||') > -1 ? args.split('||') : args.split('|');
      let data = getExifData(fileObj.dir + '/' + fileObj.base);
      let returnText = '';
      switch (argArray[0].trim().toLowerCase()) {
        case 'i':
        case 'iso':
        case 'i[so]': {
          printIfVerbose(fileObj, 'Getting ISO value from ' + fileObj.base);
          if (typeof(data) === 'object' && data.SubExif && data.SubExif.PhotographicSensitivity) {
            returnText = data.SubExif.PhotographicSensitivity;
          } else {
            printIfVerbose(fileObj, 'ISO not found');
          }
          break;
        }
        case 'f':
        case 'fnum':
        case 'f[num]': {
          printIfVerbose(fileObj, 'Getting f number value from ' + fileObj.base);
          if (typeof(data) === 'object' && data.SubExif && data.SubExif.FNumber) {
            returnText = data.SubExif.FNumber[0];
          } else {
            printIfVerbose(fileObj, 'F number not found');
          }
          break;
        }
        case 'e':
        case 'exposure':
        case 'e[xposure]': {
          printIfVerbose(fileObj, 'Getting exposure value from ' + fileObj.base);
          if (typeof(data) === 'object' && data.SubExif && data.SubExif.ExposureTime) {
            if (data.SubExif.ExposureTime[0] < 1) {
              returnText =  n2f(data.SubExif.ExposureTime[0]).replace('/', '-');
              break;
            } else {
              returnText =  data.SubExif.ExposureTime[0];
            }
          } else {
            printIfVerbose(fileObj, 'Exposure not found');
          }
          break;
        }
        case 'd':
        case 'date':
        case 'd[ate]': {
          printIfVerbose(fileObj, 'Getting date value from ' + fileObj.base);
          let dFormat = argArray[1] || 'yyyymmdd';
          if (typeof(data) === 'object' && data.DateTime) {
            let formattedDate = data.DateTime.split(/:|\s/)[1] + '/' + data.DateTime.split(/:|\s/)[2] + '/' + data.DateTime.split(/:|\s/)[0] + ' ' + data.DateTime.split(/:|\s/)[3] + ':' + data.DateTime.split(/:|\s/)[4] + ':' + data.DateTime.split(/:|\s/)[5];
            returnText = dateFormat(formattedDate, dFormat);
          } else {
            printIfVerbose(fileObj, 'Date not found');
          }
          break;
        }
        case 'h':
        case 'height':
        case 'h[eight]': {
          printIfVerbose(fileObj, 'Getting pixel height value from ' + fileObj.base);
          if (typeof(data) === 'object' && data.SubExif && data.SubExif.PixelYDimension) {
            returnText = data.SubExif.PixelYDimension;
          } else {
            printIfVerbose(fileObj, 'Height not found');
          }
          break;
        }
        case 'w':
        case 'width':
        case 'w[idth]': {
          printIfVerbose(fileObj, 'Getting pixel width value from ' + fileObj.base);
          if (typeof(data) === 'object' && data.SubExif && data.SubExif.PixelXDimension) {
            returnText = data.SubExif.PixelXDimension;
          } else {
            printIfVerbose(fileObj, 'Width not found');
          }
          break;
        }
      }
      printIfVerbose(fileObj, 'returning: ' + returnText);
      printIfVerbose(fileObj, '---Exif End---');
      return returnText;
    }
  },
  'eiso': {
    name: 'Exif ISO',
    description: "Photo ISO value",
    unique: false,
    deprecated: true,
    deprecationMessage: 'please use {{exif|iso}} instead',
    function: function(fileObj) {
      let data = getExifData(fileObj.dir + '/' + fileObj.base);
      return (typeof(data) === 'object' && data.SubExif && data.SubExif.PhotographicSensitivity ? data.SubExif.PhotographicSensitivity : '');
    }
  },
  'efnum': {
    name: 'Exif FNumber',
    description: "Photo FNumber value",
    unique: false,
    deprecated: true,
    deprecationMessage: 'please use {{exif|fnum}} instead',
    function: function(fileObj) {
      let data = getExifData(fileObj.dir + '/' + fileObj.base);
      return (typeof(data) === 'object' && data.SubExif && data.SubExif.FNumber ? data.SubExif.FNumber[0] : '');
    }
  },
  'eex': {
    name: 'Exif Exposure Time',
    description: "Photo exposure time value",
    unique: false,
    deprecated: true,
    deprecationMessage: 'please use {{exif|exposure}} instead',
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
    deprecated: true,
    deprecationMessage: 'please use {{exif|date}} instead',
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
    deprecated: true,
    deprecationMessage: 'please use {{exif|height}} instead',
    function: function(fileObj) {
      let data = getExifData(fileObj.dir + '/' + fileObj.base);
      return (typeof(data) === 'object' && data.SubExif && data.SubExif.PixelYDimension ? data.SubExif.PixelYDimension : '');
    }
  },
  'ew': {
    name: 'Exif Width',
    description: "The width in pixels of the photo",
    unique: false,
    deprecated: true,
    deprecationMessage: 'please use {{exif|width}} instead',
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

function printIfVerbose(fileObj, text) {
  if (fileObj && fileObj.options && fileObj.options.verbose) {
    console.log(text);
  }
}

module.exports = replacements;