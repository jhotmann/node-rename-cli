const chalk = require('chalk');
const clear = require('cli-clear');
const clipboardy = require('clipboardy');
const globby = require("globby");
const index = require('../index');
const inquirer = require('inquirer');
const path = require('path');

let globalObj = {};

function wizard() {
  let files = globby.sync('*.*');
  let fileTypes = ['*.*'];
  files.forEach(function(value) {
    let fileObj = path.parse(path.resolve(value));
    let ext = fileObj.ext;
    if (fileTypes.indexOf('*' + ext) === -1) {
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
    choices: [{name: 'Use RegEx', value: 'r'}, {name: 'Do not append index to output files', value: 'n'}, {name: 'Force overwrite file conflicts', value: 'f'}, {name: 'Verbose output', value: 'v'}]
  }).then(function(answers) {
    globalObj.options = {
      regex: false,
      force: (answers.options.indexOf('f') > -1),
      verbose: (answers.options.indexOf('v') > -1),
      noIndex: (answers.options.indexOf('n') > -1),
      noTrim: false
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
  console.log('\n\n\nVariables:\n\n' + index.getReplacementsList());
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
  let operations = index.getOperations(index.getFileArray(globalObj.inputFiles), path.parse(globalObj.outputFiles), globalObj.options);
  console.log('\nYour rename command is:\n\n  ' + theCommand + '\n\nPerforming the following operation(s):\n');
  operations.forEach(function(value) {
    if (value.conflict) {
      console.log(chalk.yellow(value.text));
    } else {
      console.log(value.text);
    }
  });
  if (index.hasConflicts(operations)) {
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
      index.run(operations, globalObj.options);
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
  let regex = (globalObj.options.regex ? ' -r "' + globalObj.options.regex + '"' : '');
  let force = (globalObj.options.force ? ' -f' : '');
  let verbose = (globalObj.options.verbose ? ' -v' : '');
  let noIndex = (globalObj.options.noIndex ? ' -n' : '');
  let filesArr = globalObj.inputFiles.map(function(value) { return escapeText(value); });
  let files = filesArr.join(' ');
  return (process.platform === 'win32' ? 'rname' : 'rename') + regex + force + verbose + noIndex + ' ' + files + ' ' + escapeText(globalObj.outputFiles);
}

function escapeText(theString) {
  if (theString.indexOf(' ') > -1 || theString.indexOf('|') > -1) {
    return '"' + theString + '"';
  }
  return theString;
}

module.exports = wizard;