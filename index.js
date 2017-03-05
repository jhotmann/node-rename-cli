const _ = require('lodash');
const fileExists = require('file-exists');
const fs = require('fs');
const glob = require("glob");
const os = require('os');
const path = require('path');
const prompt = require('prompt-sync')();
const defaultReplacements = require('./replacements');
const userReplacements = require(os.homedir() + '/.rename/replacements.js');

const replacements = _.merge(defaultReplacements, userReplacements);

module.exports = {
  thecommand: function(args) {
    if (args.s) {
      console.log('');
    }
    let newFileName = path.parse(_.last(args._));
    let files = _.dropRight(args._);
    if (files.length === 0) {
      console.log('ERROR: Not enough arguments specified. Type rename -h for help');
      process.exit(1);
    }
    if (files.length === 1) { // TODO change this in case people specify multiple wildcard sources
      files = glob.sync(files[0]);
    }
    let fileIndex = 1;
    _.forEach(files, function(value) {
      let uniqueName = (files.length > 1 ? false: true);
      let fullPath = path.resolve(value);
      let fileObj = path.parse(fullPath);
      fileObj.newName = newFileName.name;
      fileObj.newNameExt = (newFileName.ext ? newFileName.ext : fileObj.ext);
      fileObj.index = fileIndexString(files.length, fileIndex);
      
      // replace the replacement strings with their value
      _.forEach(replacements, function(value, key) {
        if (fileObj.newName.indexOf(key) > -1 && value.unique) {
          uniqueName = true;
        }
        fileObj.newName = fileObj.newName.replace(key, value.function(fileObj));
      });

      // if output file names are not unique append file index
      if (!uniqueName) {
        fileObj.newName = fileObj.newName + fileObj.index;
      }

      // if argument --s specified just print what the output would be
      if (args.s) {
        console.log(fileObj.base + ' → ' + fileObj.newName + fileObj.newNameExt);
      } else { // rename the file(s)
        let originalFileName = path.format({dir: fileObj.dir, base: fileObj.base});
        let outputFileName = path.format({dir: fileObj.dir, base: fileObj.newName + fileObj.newNameExt});
        
        // if output file name already exists prompt for overwrite unless --f specified.
        if (!args.f && fileExists.sync(outputFileName)) {
          let response = prompt(fileObj.newName + fileObj.newNameExt + ' already exists. Would you like to replace it? (y/n) ');
          if (response === 'y') {
            renameFile(originalFileName, outputFileName);
          }
        } else {
          renameFile(originalFileName, outputFileName);
        }
      }
      fileIndex += 1;
    });
  },
  getReplacements: function() {
    _.forEach(replacements, function(value, key) {
      let spaces = (14 - key.length > 0 ? 14 - key.length : 1);
      console.log(' ' + key + ' '.repeat(spaces) + value.name + ': ' + value.description);
    });
  }
};

function renameFile(oldName, newName) {
  fs.rename(oldName, newName, function(err) {
    if (err) {
      console.log('ERROR: ' + err);
    }
  });
}

function fileIndexString(total, index) {
  let totString = '' + total;
  let returnString = '' + index;
  while (returnString.length < totString.length) {
    returnString = '0' + returnString;
  }
  return returnString;
}
