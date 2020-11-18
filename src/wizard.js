const async = require('async');
const clear = require('cli-clear');
const clipboardy = require('clipboardy');
const globby = require('globby');
const fs = require('fs-extra');
const inquirer = require('inquirer');
const path = require('path');
const util = require('./util');

const { Batch } = require('./batch');

module.exports = async function(sequelize) {
  let argv = {
    _: []
  };
  const files = await globby('*', { onlyFiles: false });
  let fileTypes = ['*', '**/*', '*.*'];
  async.eachSeries(files, async (f) => {
    const fileObj = path.parse(path.resolve(f));
    const stats = await fs.lstat(path.format(fileObj));
    if (stats.isDirectory()) {
      files[files.indexOf(f)] = f + '/';
      let ext = fileObj.ext;
      if (ext && fileTypes.indexOf('*' + ext) === -1) {
        fileTypes.push('*' + ext);
      }
    }
  });
  fileTypes.push('Other');
  clear();
  const answer1 = await inquirer.prompt({
    type: 'list',
    name: 'fileTypes',
    message: 'Files to rename',
    choices: fileTypes,
    default: 0
  });
  if (answer1.fileTypes === 'Other') { // user can select the individual files they wish to rename
    const answer2 = await inquirer.prompt({
      type: 'checkbox',
      name: 'files',
      message: 'Select files to rename',
      choices: files
    });
    argv._ = answer2.files;
  } else { // user selected globs
    argv._.push(answer1.fileTypes);
  }
  clear();
  const answer3 = await inquirer.prompt({
    type: 'checkbox',
    name: 'options',
    message: 'Select rename options',
    choices: [
      {name: 'Do not append index to output files', value: 'n'},
      {name: 'Force overwrite file conflicts', value: 'f'},
      {name: 'Ignore directories', value: 'd'},
      {name: 'Create missing directories', value: 'cd'},
      {name: 'Don\'t move files to different directory', value: 'nm'},
      {name: 'Don\'t trim output', value: 'nt'},
      {name: 'Verbose output', value: 'v'}]
  });
  argv.f = answer3.options.indexOf('f') > -1;
  argv.noindex = answer3.options.indexOf('n') > -1;
  argv.d = answer3.options.indexOf('d') > -1;
  argv.createdirs = answer3.options.indexOf('cd') > -1;
  argv.nomove = answer3.options.indexOf('nm') > -1;
  argv.notrim = answer3.options.indexOf('nt') > -1;
  argv.v = answer3.options.indexOf('v') > -1;
  clear();
  console.log('\n\n\nVariables:\n\n' + util.getVariableList());
  const answer4 = await inquirer.prompt({
    type: 'input',
    name: 'outputFile',
    message: 'Output file name:'
  });
  argv._.push(answer4.outputFile);
  clear();
  let theCommand = util.yargsArgvToString(argv);
  console.log(theCommand);
  console.log();
  const answer5 = await inquirer.prompt({
    type: 'list',
    name: 'whatNext',
    message: 'What would you like to do now?',
    choices: [{name: `Run the command`, value: 0}, {name: 'Copy to clipboard', value: 1}, {name: 'Restart wizard', value: 2}, {name: 'Exit', value: 3}]
  });
  if (answer5.whatNext === 0) {
    let batch = new Batch(argv, null, sequelize);
    await batch.complete();
    process.exit(0);
  } else if (answer5.whatNext === 1) {
    await clipboardy.write(theCommand);
    console.log('Command copied to clipboard');
    process.exit(0);
  } else if (answer5.whatNext ===2) {
    await this();
    process.exit(0);
  } else {
    process.exit(0);
  }
};