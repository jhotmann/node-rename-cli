const chalk = require('chalk');
const clear = require('cli-clear');
const clipboardy = require('clipboardy');
const globby = require('globby');
const fs = require('fs-extra');
const rename = require('../rename');
const inquirer = require('inquirer');
const path = require('path');

let globalObj = {};

function wizard() {
  let files = globby.sync('*', { onlyFiles: false });
  let fileTypes = ['*', '**/*', '*.*'];
  files.forEach(function(value) {
    let fileObj = path.parse(path.resolve(value));
    if (fs.statSync(path.format(fileObj)).isDirectory()) {
      files[files.indexOf(value)] = value + '/';
    }
    let ext = fileObj.ext;
    if (ext && fileTypes.indexOf('*' + ext) === -1) {
      fileTypes.push('*' + ext);
    }
  });
  fileTypes.push('Other');
  clear();
  inquirer.prompt({
    type: 'list',
    name: 'fileTypes',
    message: 'Files to rename',
    choices: fileTypes,
    default: 0
  }).then(function(answers) {
    if (answers.fileTypes === 'Other') {
      otherFileType(files);
    } else {
      globalObj.inputFiles = [answers.fileTypes];
      chooseOptions();
    }
  });
}

function otherFileType(fileArray) {
  clear();
  inquirer.prompt({
    type: 'checkbox',
    name: 'files',
    message: 'Select files to rename',
    choices: fileArray
  }).then(function(answers) {
    globalObj.inputFiles = answers.files;
    chooseOptions();
  });
}

function chooseOptions() {
  clear();
  inquirer.prompt({
    type: 'checkbox',
    name: 'options',
    message: 'Select rename options',
    choices: [
      {name: 'Use RegEx', value: 'r'},
      {name: 'Do not append index to output files', value: 'n'},
      {name: 'Force overwrite file conflicts', value: 'f'},
      {name: 'Keep both files if conflicting name', value: 'k'},
      {name: 'Ignore directories', value: 'd'},
      {name: 'Create missing directories', value: 'cd'},
      {name: 'Don\'t move files to different directory', value: 'nm'},
      {name: 'Don\'t trim output', value: 'nt'},
      {name: 'Verbose output', value: 'v'}]
  }).then(function(answers) {
    globalObj.options = {
      regex: false,
      force: (answers.options.indexOf('f') > -1),
      verbose: (answers.options.indexOf('v') > -1),
      noIndex: (answers.options.indexOf('n') > -1),
      noTrim: (answers.options.indexOf('nt') > -1),
      ignoreDirectories: (answers.options.indexOf('d') > -1),
      createDirs: (answers.options.indexOf('cd') > -1),
      noMove: (answers.options.indexOf('nm') > -1),
      keep: (answers.options.indexOf('k') > -1)
    };
    if (answers.options.includes('r')) {
      clear();
      inquirer.prompt({
        type: 'input',
        name: 'regex',
        message: 'What is your regular expression?'
      }).then(function(regexAnswers) {
        globalObj.options.regex = regexAnswers.regex;
        outputFiles();
      });
    } else {
      outputFiles();
    }
  });
}

function outputFiles() {
  clear();
  console.log('\n\n\nVariables:\n\n' + rename.getReplacementsList());
  inquirer.prompt({
    type: 'input',
    name: 'outputFiles',
    message: 'Output file name:'
  }).then(function(answers) {
    globalObj.outputFiles = answers.outputFiles;
    whatNow();
  });
}

function whatNow() {
  clear();
  let theCommand = getCommandText();
  let operations = rename.getOperations(rename.getFileArray(globalObj.inputFiles), path.parse(globalObj.outputFiles), globalObj.options);
  console.log('\nYour rename command is:\n\n  ' + theCommand + '\n\nPerforming the following operation(s):\n');
  operations.forEach(function(value) {
    if (value.conflict) {
      console.log(chalk.yellow(value.text));
    } else {
      console.log(value.text);
    }
  });
  if (rename.hasConflicts(operations)) {
    console.log(chalk.yellow('\nWARNING: There are conflicting file names'));
  }
  console.log('');
  inquirer.prompt({
    type: 'list',
    name: 'whatNext',
    message: 'What would you like to do now?',
    choices: [{name: 'Run the command', value: 0}, {name: 'Copy to clipboard', value: 1}, {name: 'Restart wizard', value: 2}, {name: 'Exit', value: 3}]
  }).then(function(answers) {
    if (answers.whatNext === 0) {
      rename.run(operations, globalObj.options);
    } else if (answers.whatNext === 1) {
      clipboardy.writeSync(theCommand);
      console.log('Command copied to clipboard');
    } else if (answers.whatNext ===2) {
      wizard();
    } else {
      process.exit(0);
    }
  });
}

function getCommandText() {
  let filesArr = globalObj.inputFiles.map(function(value) { return escapeText(value); });
  let command = (process.platform === 'win32' ? 'rname' : 'rename') + 
    (globalObj.options.regex ? ' -r "' + globalObj.options.regex + '"' : '') +
    (globalObj.options.force ? ' -f' : '') +
    (globalObj.options.keep ? ' -k' : '') +
    (globalObj.options.noIndex ? ' -n' : '') +
    (globalObj.options.ignoreDirectories ? ' -d' : '') +
    (globalObj.options.verbose ? ' -v' : '') +
    (globalObj.options.createDirs ? ' --createdirs' : '') +
    (globalObj.options.noMove ? ' --nomove' : '') + ' ' +
    filesArr.join(' ') + ' ' + escapeText(globalObj.outputFiles);
  return command;
}

function escapeText(theString) {
  if (theString.indexOf(' ') > -1 || theString.indexOf('|') > -1) {
    return '"' + theString + '"';
  }
  return theString;
}

module.exports = wizard;