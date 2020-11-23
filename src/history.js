const async = require('async');
const clear = require('cli-clear');
const clipboardy = require('clipboardy');
const fs = require('fs-extra');
const inquirer = require('inquirer');
const moment = require('moment');
const path = require('path');
const term = require('terminal-kit').terminal;
const yargs = require('yargs');

const util = require('./util');
const yargsOptions = require('../lib/yargsOptions');

const { Batch } = require('./batch');

module.exports.History = class History {
  constructor(sequelize, options) {
    this.sequelize = sequelize;
    this.options = options;
    this.count = options.history || 10;
    this.includeUndone = !options.noUndo;
    this.batches = [];
    this.page = 1;
  }

  async getBatches(page) {
    if (parseInt(page) > 0) this.page = page;
    let queryParams = {
      limit: this.count,
      order: [[ 'createdAt', 'DESC' ]],
      include: this.sequelize.models.Op
    };
    if (!this.includeUndone) queryParams.where = { undone: false };
    if (page > 1) queryParams.offset = (this.count * (page - 1));
    this.batches = await this.sequelize.models.Batch.findAll(queryParams);
  }

  async undo(ops, cwd, cls) {
    if (cls) clear();
    cwd = (cwd || process.cwd()) + path.sep;
    await async.eachSeries(ops, async (o) => {
      if (this.options.verbose) console.log(`${o.output.replace(cwd, '')} → ${o.input.replace(cwd, '')}`);
      const fileExists = await fs.pathExists(o.output);
      if (!fileExists) {
        console.log(`${o.output} no longer exists`);
      } else {
        await fs.rename(o.output, o.input);
        o.undone = true;
        await o.save();
      }
    });
  }

  async undoBatch(index, cls) {
    if (this.batches.length > index) {
      let batch = this.batches[index];
      this.undo(batch.Ops, batch.cwd, cls);
      batch.undone = true;
      await batch.save();
    } else {
      console.log('The specified index is out of bounds');
    }
  }

  async display() {
    clear();
    let choices = await async.mapSeries(this.batches, async (b) => {
      return {
        name: `${moment(b.createdAt).format('MMMM Do YYYY, h:mm:ss a')} (${b.Ops.length} operations)${b.undone ? ' - Undone' : ''}`,
        value: this.batches.indexOf(b)
      };
    });
    choices.push({ name: 'More...', value: -1});
    if (this.page > 1) choices = [{ name: 'Previous', value: -2 }, ...choices];
    const selection = await inquirer.prompt({
      type: 'list',
      loop: false,
      message: 'Select a batch to view more information and options',
      name: 'batch',
      default: 0,
      choices: choices,
      pageSize: 20
    });
    clear();
    if (selection.batch === -1) {
      await this.getBatches(this.page + 1);
      await this.display();
      return;
    } else if (selection.batch === -2) {
      await this.getBatches(this.page - 1);
      await this.display();
      return;
    } else {
      await this.displayBatch(selection.batch);
    }
  }

  async displayBatch(index) {
    if (index < 0 || index >= this.batches.length) {
      console.log('displayBatch index out of range');
      process.exit(1);
    }
    const selectedBatch = this.batches[index];
    const theCommand = util.argvToString(JSON.parse(selectedBatch.command));
    const workingDir = selectedBatch.cwd + path.sep;
    const opsText = await async.reduce(selectedBatch.Ops, '', async (collector, o) => {
      collector += `${o.input.replace(workingDir, '')} → ${o.output.replace(workingDir, '')}${o.undone ? ' (undone)': ''}\n`;
      return collector;
    });
    console.log();
    term.table([
      ['Command: ', theCommand],
      ['Working Dir: ', `${selectedBatch.cwd}          `],
      ['Operations: ', opsText] ], {
      hasBorder: true,
      borderChars: 'lightRounded',
      fit: true
    });
    console.log();
    let choices;
    if (selectedBatch.undone) choices = ['Go Back', 'Re-run the Command', 'Copy the Command', 'Add to Favorites', 'Remove from History', 'Exit'];
    else choices = ['Go Back', 'Undo Every Operation', 'Undo Some Operations', 'Re-run the Command', 'Copy the Command', 'Add to Favorites', 'Remove from History', 'Exit'];
    const selection = await inquirer.prompt({
      type: 'list',
      loop: false,
      message: 'What would you like to do?',
      name: 'choice',
      default: 0,
      choices: choices
    });
    switch (selection.choice) {
      case 'Go Back':
        await this.display();
        return;
      case 'Undo Every Operation':
        await this.undoBatch(index, true);
        return;
      case 'Undo Some Operations':
        await this.displayOps(index);
        return;
      case 'Re-run the Command':
        process.chdir(selectedBatch.cwd);
        await this.runCommand(theCommand);
        return;
      case 'Copy the Command':
        await clipboardy.write(theCommand);
        return;
      case 'Add to Favorites':
        await this.addToFavorites(selectedBatch.command);
        return;
      case 'Remove from History':
        await selectedBatch.destroy();
        await this.getBatches(this.page);
        await this.display();
        return;
      default: process.exit(0);
    }
  }

  async runCommand(command) {
    if (this.options.verbose) console.log('Command: ' + command);
    let argv = yargs.options(yargsOptions).parse(command.replace(/^re?name /, ''));
    let batch = new Batch(argv, null, this.sequelize);
    batch.setCommand(command);
    await batch.complete();
  }

  async addToFavorites(command) {
    let favoriteData = { command: command };
    const input = await inquirer.prompt({
      type: 'input',
      name: 'alias',
      message: 'Enter an alias for this favorite (optional)',
    });
    if (input.alias) favoriteData.alias = input.alias;
    let favorite = this.sequelize.models.Favorites.build(favoriteData);
    await favorite.save();
    console.log(`Command added to favorites. ID: ${favorite.id}`);
  }

  async displayOps(index) {
    if (index < 0 || index >= this.batches.length) {
      console.log('displayBatch index out of range');
      process.exit(1);
    }
    const selectedBatch = this.batches[index];
    const workingDir = selectedBatch.cwd + path.sep;
    clear();
    console.log(util.argvToString(JSON.parse(selectedBatch.command)));
    let choices = await async.mapSeries(selectedBatch.Ops, async (o) => {
      return {
        name: `${o.input.replace(workingDir, '')} → ${o.output.replace(workingDir, '')}`,
        disabled: o.undone ? 'undone' : false,
        value: o
      };
    });
    const selection = await inquirer.prompt({
      type: 'checkbox',
      message: 'Select the operations to undo',
      name: 'ops',
      choices: choices,
      pageSize: (selectedBatch.Ops.length > 20 ? 20 : selectedBatch.Ops.length)
    });
    this.undo(selection.ops, selectedBatch.cwd, true);
  }
};