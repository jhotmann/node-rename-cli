const fs = require('fs-extra');
const globby = require("globby");
const nunjucks = require('nunjucks');
const os = require('os');
const path = require('path');
const pathExists = require('path-exists');
const prompt = require('prompt-sync')();
const traverse = require('traverse');
const defaultData = require('./lib/data');

let env = nunjucks.configure({ autoescape: true, noCache: true });
const dateFilter = require('./lib/filters/date');
const customFilters = require('./lib/filters/custom');
env.addFilter('date', dateFilter);
Object.keys(customFilters).forEach(f => env.addFilter(f, customFilters[f]));
if (pathExists.sync(os.homedir() + '/.rename/userFilters.js')) {
  let userFilters = require(os.homedir() + '/.rename/userFilters.js');
  Object.keys(userFilters).forEach(f => env.addFilter(f, userFilters[f]));
}

let userData;
if (pathExists.sync(os.homedir() + '/.rename/userData.js')) {
  userData = require(os.homedir() + '/.rename/userData.js');
} else {
  userData = function() { return {}; };
}
const UNDO_FILE = os.homedir() + '/.rename/undo.json';

function printData(file, options) {
  let fullPath = path.resolve(file);
  if (options.ignoreDirectories && fs.lstatSync(fullPath).isDirectory()) return;
  let fileObj = path.parse(fullPath);
  fileObj.options = options;
  let d = defaultData(fileObj);
  let userD = userData(fileObj);
  let allData = Object.assign(d, userD);
  console.dir(allData);
  process.exit(0);
}

function getOperations(files, newFileName, options) {
  // Build file objects
  let fileObjects = files.map(f => {
    let fullPath = path.resolve(f);
    if (options.ignoreDirectories && fs.lstatSync(fullPath).isDirectory()) return;
    let fileObj = path.parse(fullPath);
    let newFileNameRegexp = new RegExp(newFileName.ext.replace('|', '\\|') + '$');

    // Periods inside of replacement variables can be counted as file extensions, we don't want that
    if (newFileName.ext.includes('{{')) {
      newFileName.base = newFileName.base.replace(newFileNameRegexp, '').replace(/^"|"$/g, '');
      newFileName.ext = replaceVariables(fileObj, newFileName.ext);
    }
    if (newFileName.ext.indexOf('}}') > -1 || newFileName.ext.indexOf('%}') > -1) {
      newFileName.name = newFileName.base;
      newFileName.ext = '';
    }

    fileObj.newName = (newFileName.ext ? newFileName.base.replace(newFileNameRegexp, '') : newFileName.base).replace(/^"|"$/g, '');
    fileObj.newNameExt = (newFileName.ext ? newFileName.ext : (options.noExt ? '' : fileObj.ext));
    fileObj.options = options;
    fileObj = replaceVariables(fileObj);
    if (!options.noTrim) fileObj.newName = fileObj.newName.trim();
    return fileObj;
  }).filter(f => f !== undefined);

  // Add indices
  if (!options.noIndex) {
    let counts = {};
    let indices = {};
    fileObjects.forEach(fileObj => {
      let newName = replaceVariables(fileObj, newFileName.dir) + '/' + fileObj.newName.toLowerCase() + '.' + fileObj.newNameExt.toLowerCase();
      if (counts[newName]) {
        counts[newName] += 1; 
      } else {
        counts[newName] = 1;
        indices[newName] = 1;
      }
    });
    fileObjects = fileObjects.map(fileObj => {
      let newName = replaceVariables(fileObj, newFileName.dir) + '/' + fileObj.newName.toLowerCase() + '.' + fileObj.newNameExt.toLowerCase();
      let index = indices[newName];
      let count = counts[newName];
      if (count !== 1) {
        fileObj.index = index;
        fileObj.total = count;
        if (fileObj.newName.indexOf('--FILEINDEXHERE--') > -1) {
          fileObj.newName = fileObj.newName.replace('--FILEINDEXHERE--', fileIndexString(count, index));
        } else {
          fileObj.newName = fileObj.newName + fileIndexString(count, index);
        }
        indices[newName] += 1;
      }
      return fileObj;
    });
  }

  // Generate operations
  let operations = [];
  fileObjects.forEach(fileObj => {
    let operationText = path.format(fileObj).replace(process.cwd(), '').replace(/^[\\/]/, '') + ' → ';
    let newFileObj = { base: fileObj.newName + fileObj.newNameExt };
    if (options.noMove) {
      newFileObj.dir = fileObj.dir;
      operationText += fileObj.newName + fileObj.newNameExt;
    } else {
      let newDirectory = replaceVariables(fileObj, newFileName.dir);
      newFileObj.dir = path.resolve(fileObj.dir, newDirectory);
      operationText += path.format(newFileObj).replace(process.cwd(), '').replace(/^[\\/]/, '');
    }
    let originalFileName = path.format({dir: fileObj.dir, base: fileObj.base});
    let outputFileName = path.format(newFileObj);
    let conflict = (operations.find(function(o) { return o.output === outputFileName; }) ? true : false);
    let alreadyExists = false;
    let directoryExists = true;
    let deprecationMessages = fileObj.deprecationMessages;
    if (originalFileName.toLowerCase() !== outputFileName.toLowerCase()) {
      alreadyExists = pathExists.sync(outputFileName);
      directoryExists = pathExists.sync(newFileObj.dir);
    }
    let operationObj = {text: operationText,
      original: originalFileName,
      output: outputFileName,
      conflict: conflict,
      alreadyExists: alreadyExists,
      directoryExists: directoryExists,
      deprecationMessages: deprecationMessages};
    if (!directoryExists) operationObj.missingDirectory = newFileObj.dir;
    operations.push(operationObj);
  });

  return operations;
}

function argvToOptions(argv) {
  let options = {
    regex: (argv.r ? (Array.isArray(argv.r) ? argv.r : [argv.r]) : false),
    keep: (argv.k ? true : false),
    force: (argv.f ? true : false),
    simulate: (argv.s ? true : false),
    prompt: (argv.p ? true: false),
    verbose: (argv.v ? true : false),
    noIndex: (argv.n ? true : false),
    noTrim: (argv.notrim ? true : false),
    ignoreDirectories: (argv.d ? true : false),
    noMove: (argv.nomove ? true : false),
    createDirs: (argv.createdirs ? true : false),
    noExt: (argv.noext ? true : false)
  };
  if (options.noMove && options.createDirs) options.createDirs = false;
  return options;
}

function getFileArray(files) {
  files = files.map(f => {
    if (Number.isInteger(f)) f = '' + f;
    return f.replace(/\[/g, '\\[').replace(/\]/g, '\\]');
  });
  if (globby.hasMagic(files)) {
    files = globby.sync(files, { onlyFiles: false });
  }
  return files;
}

function hasConflicts(operations) {
  return (operations.find(function(o) { return (o.conflict === true || o.alreadyExists === true); }) ? true : false);
}

function hasMissingDirectories(operations) {
  return (operations.find(function(o) { return (o.directoryExists === false); }) ? true : false);
}

function run(operations, options, exitWhenFinished) { // RENAME files
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
  let createdDirectories = [];
  operations.forEach(function(operation) {
    if (!options.force && operation.original.toLowerCase() !== operation.output.toLowerCase() && pathExists.sync(operation.output)) { // If file already exists
      if (options.keep) {
        operation = keepFiles(operation);
        renameFile(operation.original, operation.output, options.verbose);
        completedOps.push(operation);
      } else {
        console.log('\n' + operation.text + '\n' + operation.text.split(' → ')[1] + ' already exists. What would you like to do?');
        console.log('1) Overwrite the file');
        console.log('2) Keep both files');
        console.log('3) Skip');
        let response = prompt('Please input a number: ');
        if (response === '1') {
          renameFile(operation.original, operation.output, options.verbose);
          completedOps.push(operation);
        } else if (response === '2') {
          operation = keepFiles(operation);
          renameFile(operation.original, operation.output, options.verbose);
          completedOps.push(operation);
        }
      }
    } else if (!operation.directoryExists && operation.missingDirectory && operation.original.toLowerCase() !== operation.output.toLowerCase() && createdDirectories.indexOf(operation.missingDirectory) === -1) { // Directory doesn't exist
      if (options.force || options.createDirs) {
        fs.mkdirpSync(operation.missingDirectory);
        renameFile(operation.original, operation.output, options.verbose);
        completedOps.push(operation);
      } else {
        console.log('\n' + operation.text + '\n' + operation.missingDirectory + ' does not exist. What would you like to do?');
        console.log('1) Create Directory');
        console.log('2) Skip');
        let response = prompt('Please input a number: ');
        if (response === '1') {
          createdDirectories.push(operation.missingDirectory);
          fs.mkdirpSync(operation.missingDirectory);
          renameFile(operation.original, operation.output, options.verbose);
          completedOps.push(operation);
        }
      }
    } else { // file doesn't already exist and directory exists
      renameFile(operation.original, operation.output, options.verbose);
      completedOps.push(operation);
    }
  });

  writeUndoFile(completedOps, (exitWhenFinished === true ? true : false));
}

function getVariableList() {
  let defaultVars = defaultData(path.parse(__filename), true);
  return traverse.paths(defaultVars).map(v => {
    if (v.length === 1 && typeof defaultVars[v[0]] !== "object") {
      return '{{' + v[0] + '}}' + ' - ' + defaultVars[v[0]];
    } else if (v.length > 1) {
      let p = v.join('.');
      let value;
      v.forEach(val => {
        if (!value) value = defaultVars[val];
        else value = value[val];
      });
      return '{{' + p + '}}' + ' - ' + value;
    }
  }).filter(v => v !== undefined).join('\n\n');
}

// function getReplacementsList() { // GET LIST OF REPLACEMENT VARIABLES
//   let descIndex = 16;
//   let returnText = '';
//   // filter out deprecated replacement variables
//   Object.keys(REPLACEMENTS).filter(r => { return REPLACEMENTS[r].deprecated === true ? false : true; }).forEach(function(key) {
//     let value = REPLACEMENTS[key];
//     let spaces = (descIndex - key.length - 4 > 0 ? descIndex - key.length - 4 : 1);
//     returnText += ' {{' + key + '}}' + ' '.repeat(spaces) + value.name + ': ' + value.description + '\n';
//     if (value.parameters) {
//       returnText += ' '.repeat(descIndex + 3) + 'Parameters: ' + value.parameters.description + '\n';
//     }
//   });
//   return returnText;
// }

// function getReplacements() {
//   return REPLACEMENTS;
// }

function undoRename() { // UNDO PREVIOUS RENAME
  fs.readJSON(UNDO_FILE, (err, packageObj) => {
    if (err) throw err;
    let ops = [];
    packageObj.forEach(function(value) {
      [value.original, value.output] = [value.output, value.original];
      value.directoryExists = true;
      ops.push(value);
    });
    run(ops);
  });
}

function renameFile(oldName, newName, verbose) { // rename the file
  oldName = oldName.replace(/\\\[/g, '[').replace(/\\\]/g, ']');
  newName = newName.replace(/\\\[/g, '[').replace(/\\\]/g, ']');
  if (pathExists.sync(oldName)) {
    fs.renameSync(oldName, newName);
    if (verbose) console.log(`${oldName} renamed to ${newName}`);
  } else {
    console.log(oldName + ' does not exist! Operation skipped.');
  }
}

function writeUndoFile(operations, exitWhenFinished) {
  fs.writeJSON(UNDO_FILE, operations, (err) => {
    if (err) throw err;
    if (exitWhenFinished) process.exit(0);
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

function replaceVariables(fileObj, someString) {
  let d = defaultData(fileObj);
  let userD = userData(fileObj);
  let allData = Object.assign(d, userD); // Merge default and user data objects (user data overrides default data)
  try {
    if (someString === undefined || someString === null) {
      fileObj.newName = nunjucks.renderString(fileObj.newName, allData);
      return fileObj;
    } else {
      return nunjucks.renderString(someString, allData);
    }
  } catch(e) {
    throw(e.name + ': ' + e.message + '\n' + (someString ? someString : fileObj.newName));
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

module.exports = {
  getOperations: getOperations,
  argvToOptions: argvToOptions,
  run: run,
  getFileArray: getFileArray,
  hasConflicts: hasConflicts,
  hasMissingDirectories: hasMissingDirectories,
  undoRename: undoRename,
  printData: printData,
  getVariableList: getVariableList
};
