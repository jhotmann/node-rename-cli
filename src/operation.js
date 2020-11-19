const chalk = require('chalk');
const fs = require('fs-extra');
const nunjucks = require('nunjucks');
const os = require('os');
const path = require('path');
const pathExists = require('path-exists');
const readlineSync = require('readline-sync');
const { FileData } = require('./fileData');

let env = nunjucks.configure({ autoescape: true, noCache: true });
const dateFilter = require('../lib/filters/date');
const customFilters = require('../lib/filters/custom');
env.addFilter('date', dateFilter);
Object.keys(customFilters).forEach(f => env.addFilter(f, customFilters[f]));
if (pathExists.sync(os.homedir() + '/.rename/userFilters.js')) {
  let userFilters = require(os.homedir() + '/.rename/userFilters.js');
  Object.keys(userFilters).forEach(f => env.addFilter(f, userFilters[f]));
}

const CURRENT_DIR = process.cwd() + path.sep;

module.exports.Operation = class Operation {
  constructor(input, options, sequelize) {
    this.options = options;
    this.sequelize = sequelize;
    this.inputFileString = input;
    this.inputFilePath = path.parse(input);
    this.fileData = new FileData(input, options);
    this.outputString = '';
    this.outputFilePath = (path.parse(this.outputString));
    this.outputFileString = '';
    this.conflict = false;
    this.alreadyExists = false;
    this.directoryExists = true;
  }

  async replaceVariables() {
    let data;
    data = await this.fileData.get();
    this.outputString = nunjucks.renderString(this.options.outputPattern, data);
    await this.parseOutputPath();
  }

  async printData() {
    let data;
    if (this.userData) {
      data = await Object.assign(await this.fileData.get(), this.userData);
    } else {
      data = await this.fileData.get();
    }
    console.dir(data);
  }

  async parseOutputPath() {
    this.outputFilePath = path.parse(path.resolve(this.outputString));
    if (!this.outputFilePath.ext && !this.options.noExt && this.inputFilePath.ext) {
      this.outputFilePath.ext = this.inputFilePath.ext;
    }
    if (this.options.noMove) {
      this.outputFilePath.dir = this.inputFilePath.dir;
    }
    let ext = this.outputFilePath.ext || '';
    if (!ext && !this.options.noExt) { ext = this.inputFilePath.ext; }
    this.outputFileString = `${this.outputFilePath.dir}${path.sep}${this.outputFilePath.name}${ext}`;
    if (this.inputFileString.toLowerCase() !== this.outputFileString.toLowerCase()) {
      this.alreadyExists = await fs.pathExists(this.outputFileString);
      this.directoryExists = await fs.pathExists(this.outputFilePath.dir);
    } else { // prevent already exists warning if changing the case of a file name
      this.alreadyExists = false;
      this.directoryExists = true;
    }
  }

  async setIndex(index) {
    if (this.outputString.indexOf('--FILEINDEXHERE--') > -1) {
      this.outputString = this.outputString.replaceAll('--FILEINDEXHERE--', index);
    } else {
      this.outputString = appendToFileName(this.outputString, index);
    }
    await this.parseOutputPath();
  }

  setConflict(conflict) {
    this.conflict = conflict;
  }

  getOperationText() {
    return `${this.inputFileString.replace(CURRENT_DIR, '')} → ${this.outputFileString.replace(CURRENT_DIR, '')}`;
  }

  async run(batchId) {
    if (this.inputFileString.toLowerCase() !== this.outputFileString.toLowerCase()) {
      this.alreadyExists = await fs.pathExists(this.outputFileString);
    }
    if (this.alreadyExists && this.options.keep) {
      let newFileName;
      let appender = 0;
      do {
        appender += 1;
        newFileName = appendToFileName(this.outputString, `-${appender}`);
      } while(pathExists.sync(newFileName));
      this.outputString = newFileName;
      await this.parseOutputPath();
    }
    const operationText = this.getOperationText();
    if (this.options.ignoreDirectories && this.fileData.stats.isDirectory()) {
      if (this.options.verbose) console.log(chalk`{yellow Skipping ${this.inputFileString.replace(CURRENT_DIR, '')} because it is a directory}`);
      return;
    } else if (!this.options.simulate && !this.options.force && this.alreadyExists) {
      console.log(chalk`{red
${operationText}
  WARNING: ${this.outputFileString.replace(CURRENT_DIR, '')} already exists!}`);
      let response = readlineSync.keyInSelect(['Overwrite the file', 'Keep both files'], `What would you like to do?`, { cancel: 'Skip' });
      if (response === 0 && this.options.verbose) {
        console.log(chalk`{yellow Overwriting ${this.outputFileString.replace(CURRENT_DIR, '')}}`);
      } else if (response === 1) { // prompt for new file name
        let ext = this.outputFilePath.ext || '';
        if (!ext && !this.options.noExt) { ext = this.inputFilePath.ext; }
        const defaultInput = `${this.outputFilePath.dir}${path.sep}${this.outputFilePath.name}1${ext}`;
        this.outputString = readlineSync.question('Please input the desired file name (Default: $<defaultInput>): ', { defaultInput: defaultInput.replace(CURRENT_DIR, '') });
        await this.parseOutputPath();
        await this.run();
        return;
      } else if (response === -1) {
        if (this.options.verbose) console.log(`Skipping ${this.outputFileString.replace(CURRENT_DIR, '')}`);
        return;
      }
    } else if (!this.options.simulate && !this.options.force && !this.options.keep && this.conflict) {
      console.log(chalk`{keyword('orange')
${operationText}
  WARNING: This operation conflicts with other operations in this batch!
}`);
      if (!readlineSync.keyInYN(chalk.keyword('orange')('Would you like to proceed with this operation? [y/n]: '), { guide: false })) {
        if (this.options.verbose) console.log(`Skipping ${this.outputFileString.replace(CURRENT_DIR, '')}`);
        return;
      }
    } else if (!this.options.createDirs && !this.directoryExists) {
      console.log(chalk`{keyword('orange')
${operationText}
  WARNING: The directory does not exist!
}`);
      if (!readlineSync.keyInYN(chalk.keyword('orange')('Would you like to create the directory? [y/n]: '), { guide: false })) {
        if (this.options.verbose) console.log(`Skipping ${this.outputFileString.replace(CURRENT_DIR, '')}`);
        return;
      }
    } else if (this.options.verbose || this.options.simulate) {
      console.log(operationText);
    }
    if (this.options.simulate) return; // Don't perform rename
    // If it has made it this far, it's now time to rename
    if (!this.directoryExists) await fs.mkdirp(this.outputFilePath.dir);
    if (await fs.pathExists(this.inputFileString)) {
      const input = this.inputFileString.replace(/\\\[/g, '[').replace(/\\\]/g, ']');
      const output = this.outputFileString.replace(/\\\[/g, '[').replace(/\\\]/g, ']');
      await fs.rename(input, output);
      if (!this.options.noUndo && this.sequelize) { // write operations to database
        await this.sequelize.models.Op.create({
          input: input,
          output: output,
          BatchId: batchId
        });
      }
    } else if (this.options.verbose) {
      console.log(chalk`{yellow Skipping ${this.inputFileString.replace(CURRENT_DIR, '')} because the file no longer exists}`);
    }
  }
};

function appendToFileName(str, append) {
  let pathObj = path.parse(str);
  return `${pathObj.dir}${pathObj.dir !== '' ? path.sep : ''}${pathObj.name}${append}${pathObj.ext}`;
}