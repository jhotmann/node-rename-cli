const async = require('async');
const clear = require('cli-clear');
const clipboardy = require('clipboardy');
const fs = require('fs-extra');
const inquirer = require('inquirer');
const moment = require('moment');
const path = require('path');
const term = require('terminal-kit').terminal;

const util = require('./util');

module.exports.History = class History {
  constructor(sequelize, count, includeUndone) {
    this.sequelize = sequelize;
    this.count = count || 10;
    this.includeUndone = includeUndone || false;
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

  async undo(ops) {
    clear();
    await async.eachSeries(ops, async (o) => {
      console.log(`${o.output.replace(process.cwd(), '')} → ${o.input.replace(process.cwd(), '')}`);
      await fs.rename(o.output, o.input);
    });
  }

  async display() {
    clear();
    let choices = await async.map(this.batches, async (b) => {
      return {
        name: `${moment(b.createdAt).format('MMMM Do YYYY, h:mm:ss a')} (${b.Ops.length} operations)${b.undone ? ' - Undone' : ''}`,
        value: b.id
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
      choices: choices
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
      const selectedBatch = await async.filter(this.batches, async (b) => { return (b.id === selection.batch); });
      if (selectedBatch.length > 0) {
        const theCommand = util.argvToString(JSON.parse(selectedBatch[0].command));
        const workingDir = selectedBatch[0].cwd + path.sep;
        const opsText = await async.reduce(selectedBatch[0].Ops, '', async (collector, o) => {
          collector += `${o.input.replace(workingDir, '')} → ${o.output.replace(workingDir, '')}\n`;
          return collector;
        });
        console.log();
        await term.table([
          ['Command: ', theCommand],
          ['Working Dir: ', selectedBatch[0].cwd],
          ['Operations: ', opsText] ], {
          hasBorder: true,
          fit: true
        });
        console.log();
        if (selectedBatch[0].undone) choices = ['Go Back', 'Re-run the Command', 'Copy the Command', 'Exit'];
        else choices = ['Go Back', 'Undo Every Operation', 'Undo Some Operations', 'Re-run the Command', 'Copy the Command', 'Exit'];
        const selection2 = await inquirer.prompt({
          type: 'list',
          loop: false,
          message: 'What would you like to do?',
          name: 'choice',
          default: 0,
          choices: choices
        });
        switch (selection2.choice) {
          case 'Go Back':
            await this.display();
            return;
          case 'Undo Every Operation':
            await async.eachSeries(selectedBatch[0].Ops, async (o) => {
              console.log(`${o.output.replace(workingDir, '')} → ${o.input.replace(workingDir, '')}`);
              await fs.rename(o.output, o.input);
            });
            return;
          case 'Undo Some Operations':
            //TODO select operations and then filter Ops to selected and loop through
            return;
          case 'Re-run the Command':
            //TODO add ability to override cwd and run the old command
            return;
          case 'Copy the Command':
            await clipboardy.write(theCommand);
            return;
          default: process.exit(0);
        }
      }
    }
  }
};