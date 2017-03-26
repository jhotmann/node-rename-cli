const _ = require('lodash');
const fileExists = require('file-exists');
const fs = require('fs-extra');
const glob = require("glob");
const namedRegexp = require("named-js-regexp");
const os = require('os');
const path = require('path');
const prompt = require('prompt-sync')();
const defaultReplacements = require('./lib/replacements');

let userReplacements;
if (fileExists.sync(os.homedir() + '/.rename/replacements.js')) {
  userReplacements = require(os.homedir() + '/.rename/replacements.js');
} else {
  userReplacements = {};
}
const undoFile = os.homedir() + '/.rename/undo.json';

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
    let operations = [];
    let fileIndex = 1;
    
    // FOR EACH FILE
    _.forEach(files, function(value) {
      let uniqueName = (files.length > 1 ? false: true);
      let fullPath = path.resolve(value);
      let fileObj = path.parse(fullPath);
      fileObj.newName = newFileName.name;
      fileObj.newNameExt = (newFileName.ext ? newFileName.ext : fileObj.ext);
      fileObj.index = fileIndex;
      fileObj.totalFiles = files.length;

      // REGEX match and group replacement
      if (args.r) {
        let pattern;
        try {
          pattern = new RegExp(args.r.replace(/\(\?\<\w+\>/g, '('), 'g');
        } catch (err) {
          console.log(err.message);
          process.exit(1);
        }
        fileObj.regexMatches = fileObj.name.match(pattern);

        let groupNames = args.r.match(/\<[A-Za-z]+\>/g);
        if (groupNames !== null) {
          let re = namedRegexp(args.r);
          let reGroups = re.execGroups(fileObj.name);
          _.forEach(groupNames, function(value) {
            let g = value.replace(/\W/g, '');
            if (reGroups && reGroups[g]) {
              fileObj.newName = fileObj.newName.replace('{{' + g + '}}', reGroups[g]);
            } else {
              fileObj.newName = fileObj.newName.replace('{{' + g + '}}', '');
            }
          });
        }
      }
      
      // REPLACEMENT VARIABLES replace the replacement strings with their value
      let repSearch = /\{{2}([\w]+?)\}{2}|\{{2}([\w]+?)\|(.*?)\}{2}/;
      let repResult = repSearch.exec(fileObj.newName);
      while (repResult !== null) {
        let repVar = repResult[1] || repResult[2];
        if (replacements[repVar]) {
          let repObj = replacements[repVar];
          let defaultArg = (repObj.parameters && repObj.parameters.default ? repObj.parameters.default : '');
          let repArg = (repResult[3] ? repResult[3] : defaultArg);
          fileObj.newName = fileObj.newName.replace(repResult[0], repObj.function(fileObj, repArg));
          if (repObj.unique) {
            uniqueName = true;
          }
          repResult = repSearch.exec(fileObj.newName);
        }
      }

      // APPEND INDEX if output file names are not unique
      if (!uniqueName && !args.noindex) {
        fileObj.newName = fileObj.newName + replacements.i.function(fileObj, '1');
      }

      // SIMULATED if argument --s just print what the output would be
      if (args.s) {
        console.log(fileObj.base + ' → ' + fileObj.newName + fileObj.newNameExt);
      } else { // RENAME the file(s)
        let originalFileName = path.format({dir: fileObj.dir, base: fileObj.base});
        let outputFileName = path.format({dir: fileObj.dir, base: fileObj.newName + fileObj.newNameExt});
        
        // FILE EXISTS if output file name already exists prompt for overwrite unless --f specified.
        if (!args.f && fileExists.sync(outputFileName)) {
          let response = prompt(fileObj.newName + fileObj.newNameExt + ' already exists. Would you like to replace it? (y/n) ');
          if (response === 'y') {
            renameFile(originalFileName, outputFileName);
            operations.push({original: originalFileName, output: outputFileName});
          }
        } else {
          renameFile(originalFileName, outputFileName);
          operations.push({original: originalFileName, output: outputFileName});
        }
      }
      fileIndex += 1;
    });

    // WRITE OPERATIONS so they can be undone if desired
    if (!args.s) {
      writeUndoFile(operations);
    }
  },
  getReplacements: function() { // GET LIST OF REPLACEMENT VARIABLES
    let descIndex = 16;
    let returnText = '';
    _.forEach(replacements, function(value, key) {
      let spaces = (descIndex - key.length - 4 > 0 ? descIndex - key.length - 4 : 1);
      returnText += ' {{' + key + '}}' + ' '.repeat(spaces) + value.name + ': ' + value.description + '\n';
      if (value.parameters) {
        returnText += ' '.repeat(descIndex + 3) + 'Parameters: ' + value.parameters.description + '\n';
      }
    });
    return returnText;
  },
  undoRename: function() { // UNDO PREVIOUS RENAME
    let operations = [];
    fs.readJSON(undoFile, (err, packageObj) => {
      if (err) throw err;
      _.forEach(packageObj, function(value) {
        //console.dir(value);
        let originalFileName = value.original;
        let outputFileName = value.output;
        renameFile(outputFileName, originalFileName);
        operations.push({original: outputFileName, output: originalFileName});
      });
      writeUndoFile(operations);
    });
  }
};

function renameFile(oldName, newName) { // rename the file
  fs.rename(oldName, newName, function(err) {
    if (err) throw err;
  });
}

function writeUndoFile(operations) {
  fs.writeJSON(undoFile, operations, (err) => {
    if (err) throw err;
  });
}
