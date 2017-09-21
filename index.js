const _ = require('lodash');
const fs = require('fs-extra');
const globby = require("globby");
const namedRegexp = require("named-js-regexp");
const os = require('os');
const path = require('path');
const pathExists = require('path-exists');
const prompt = require('prompt-sync')();
const defaultReplacements = require('./lib/replacements');

let userReplacements;
if (pathExists.sync(os.homedir() + '/.rename/replacements.js')) {
  userReplacements = require(os.homedir() + '/.rename/replacements.js');
} else {
  userReplacements = {};
}
const UNDO_FILE = os.homedir() + '/.rename/undo.json';

const REPLACEMENTS = _.merge(defaultReplacements, userReplacements);

function getOperations(files, newFileName, options) {
  let operations = [];

  // BUILD FILE INDICIES by file extension
  let fileIndex = {};
  if (newFileName.ext) {
    fileIndex[newFileName.ext] = {
      index: 1,
      total: files.length
    };
  } else {
    _.forEach(files, function(value) {
      let fileObj = path.parse(path.resolve(value));
      if (fileIndex[fileObj.ext]) {
        fileIndex[fileObj.ext].total += 1;
      } else {
        fileIndex[fileObj.ext] = {
          index: 1,
          total: 1
        };
      }
    });
  }
  
  // FOR EACH FILE
  _.forEach(files, function(value) {
    let uniqueName = (files.length > 1 ? false: true);
    let fullPath = path.resolve(value);
    let fileObj = path.parse(fullPath);
    fileObj.newName = newFileName.name;
    fileObj.newNameExt = (newFileName.ext ? newFileName.ext : fileObj.ext);
    fileObj.index = fileIndex[fileObj.newNameExt].index;
    fileObj.totalFiles = fileIndex[fileObj.newNameExt].total;

    // REGEX match and group replacement
    if (options.regex) {
      let pattern;
      try {
        pattern = new RegExp(options.regex.replace(/\(\?\<\w+\>/g, '('), 'g');
      } catch (err) {
        console.log(err.message);
        process.exit(1);
      }
      fileObj.regexPattern = pattern;
      fileObj.regexMatches = fileObj.name.match(pattern);

      let groupNames = options.regex.match(/\<[A-Za-z]+\>/g);
      if (groupNames !== null) {
        let re = namedRegexp(options.regex);
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
      if (REPLACEMENTS[repVar]) {
        let repObj = REPLACEMENTS[repVar];
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
    if (!uniqueName && !options.noIndex) {
      fileObj.newName = fileObj.newName + REPLACEMENTS.i.function(fileObj, '1');
    }

    // TRIM output file name unless --notrim option used
    if (!options.noTrim) {
      fileObj.newName = fileObj.newName.trim();
    }

    // ADD to operations
    let operationText = fileObj.base + ' → ' + fileObj.newName + fileObj.newNameExt;
    let originalFileName = path.format({dir: fileObj.dir, base: fileObj.base});
    let outputFileName = path.format({dir: fileObj.dir, base: fileObj.newName + fileObj.newNameExt});
    let conflict = (_.find(operations, function(o) { return o.output === outputFileName; }) ? true : false);
    let alreadyExists = false;
    if (originalFileName.toLowerCase() !== outputFileName.toLowerCase()) {
      alreadyExists = pathExists.sync(outputFileName);
    }
    operations.push({text: operationText, original: originalFileName, output: outputFileName, conflict: conflict, alreadyExists: alreadyExists});

    fileIndex[fileObj.newNameExt].index += 1;
  });

  return operations;
}

function getFileArray(files) {
  if (globby.hasMagic(files)) {
    files = globby.sync(files);
  }
  return files;
}

function hasConflicts(operations) {
  return (_.find(operations, function(o) { return (o.conflict === true || o.alreadyExists === true); }) ? true : false);
}

function run(operations, options) { // RENAME files
  if (!options) {
    options = {
      regex: false,
      force: false,
      simulate: false,
      verbose: false,
      noIndex: false,
      noTrim: true
    };
  }
  let completedOps = [];
  _.forEach(operations, function(operation) {
    if (!options.force && operation.original.toLowerCase() !== operation.output.toLowerCase() && pathExists.sync(operation.output)) {
      if (options.keep) {
        operation = keepFiles(operation);
        renameFile(operation.original, operation.output);
        completedOps.push(operation);
      } else {
        console.log('\n' + operation.text + '\n' + operation.text.split(' → ')[1] + ' already exists. What would you like to do?');
        console.log('1) Overwrite the file');
        console.log('2) Keep both files');
        console.log('3) Skip');
        let response = prompt('Please input a number: ');
        if (response === '1') {
          renameFile(operation.original, operation.output);
          completedOps.push(operation);
        } else if (response === '2') {
          operation = keepFiles(operation);
          renameFile(operation.original, operation.output);
          completedOps.push(operation);
        }
      }
    } else {
      renameFile(operation.original, operation.output);
      completedOps.push(operation);
    }
  });

  writeUndoFile(completedOps);
}

function getReplacementsList() { // GET LIST OF REPLACEMENT VARIABLES
  let descIndex = 16;
  let returnText = '';
  _.forEach(REPLACEMENTS, function(value, key) {
    let spaces = (descIndex - key.length - 4 > 0 ? descIndex - key.length - 4 : 1);
    returnText += ' {{' + key + '}}' + ' '.repeat(spaces) + value.name + ': ' + value.description + '\n';
    if (value.parameters) {
      returnText += ' '.repeat(descIndex + 3) + 'Parameters: ' + value.parameters.description + '\n';
    }
  });
  return returnText;
}

function getReplacements() {
  return REPLACEMENTS;
}

function undoRename() { // UNDO PREVIOUS RENAME
  fs.readJSON(UNDO_FILE, (err, packageObj) => {
    if (err) throw err;
    let ops = [];
    _.forEach(packageObj, function(value) {
      let og = value.output;
      let out = value.original;
      value.output = out;
      value.original = og;
      ops.push(value);
    });
    run(ops);
  });
}

function renameFile(oldName, newName) { // rename the file
  try {
    fs.renameSync(oldName, newName);
  } catch (e) {
    throw(e);
  }
}

function writeUndoFile(operations) {
  fs.writeJSON(UNDO_FILE, operations, (err) => {
    if (err) throw err;
  });
}

function keepFiles(operation) {
  let appendedInt = 0;
  let newPathObj = path.parse(operation.output);
  let newFilePath;
  let newFileName;
  do {
    appendedInt += 1;
    newFilePath = newPathObj.dir + path.sep + newPathObj.name + '-' + appendedInt + newPathObj.ext;
    newFileName = newPathObj.name + '-' + appendedInt + newPathObj.ext;
  } while (pathExists.sync(newFilePath));
  operation.text = operation.text.split(' → ')[0] + ' → ' + newFileName;
  operation.output = newFilePath;
  return operation;
}

module.exports = {
  getOperations: getOperations,
  run: run,
  getFileArray: getFileArray,
  hasConflicts: hasConflicts,
  getReplacementsList: getReplacementsList,
  getReplacements: getReplacements,
  undoRename: undoRename
};
