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

module.exports.Favorites = class Favorites {
  constructor(sequelize, options) {
    this.sequelize = sequelize;
    this.options = options;
  }

  async display() {
    this.allFavorites = await this.sequelize.models.Favorites.findAll();
    clear();
    let choices = await async.mapSeries(this.allFavorites, async (f) => {
      return {
        name: `${f.id}: ${util.argvToString(JSON.parse(f.command))}${ f.alias ? ` (${f.alias})` : ''}`,
        value: f.id
      };
    });
    const selection = await inquirer.prompt({
      type: 'list',
      loop: false,
      message: 'Select a favorite to view options',
      name: 'favorite',
      default: 0,
      choices: choices,
      pageSize: 20
    });
    await this.get(selection.favorite);
    await this.displayFavorite();
  }

  async displayFavorite() {
    clear();
    console.log(`${this.selected.id}: ${util.argvToString(JSON.parse(this.selected.command))}${ this.selected.alias ? ` (${this.selected.alias})` : ''}`);
    const selection = await inquirer.prompt({
      type: 'list',
      loop: false,
      message: 'What would you like to do?',
      name: 'choice',
      default: 0,
      choices: ['Run', 'Edit Command', 'Edit Alias', 'Delete', 'Go Back']
    });
    switch (selection.choice) {
      case 'Run':
        await this.run();
        return;
      case 'Edit Command':
        await this.editCommand();
        await this.displayFavorite();
        return;
      case 'Edit Alias':
        await this.editAlias();
        await this.displayFavorite();
        return;
      case 'Delete':
        await this.delete();
        return;
      default: await this.display();
    }
  }

  async get(idOrAlias) {
    if (idOrAlias && (Number.isInteger(idOrAlias) || idOrAlias.match(/^\d+$/))) {
      const id = parseInt(idOrAlias);
      await this.getById(id);
    } else if (idOrAlias) {
      await this.getByAlias(idOrAlias);
    } else if (this.options.favorites && this.options.favorites.match(/^\d+$/)) {
      const id = parseInt(this.options.favorites);
      await this.getById(id);
    } else if (this.options.favorites) {
      await this.getByAlias(this.options.favorites);
    } else {
      await this.display();
    }
  }

  async getById(id) {
    this.selected = await this.sequelize.models.Favorites.findOne({ where: {id: id } });
  }

  async getByAlias(alias) {
    this.selected = await this.sequelize.models.Favorites.findOne({ where: {alias: alias } });
  }

  async run() {
    if (!this.selected) {
      console.log('Invalid ID or Alias');
      return;
    }
    const theCommand = util.argvToString(JSON.parse(this.selected.command));
    if (this.options.verbose) console.log(theCommand);
    let argv = yargs.options(yargsOptions).parse(theCommand.replace(/^re?name /, ''));
    let batch = new Batch(argv, null, this.sequelize);
    batch.setCommand(theCommand);
    await batch.complete();
  }

  async delete() {
    await this.selected.destroy();
    await this.display();
  }

  async editCommand() {
    //TODO
  }

  async editAlias() {
    const input = await inquirer.prompt({
      type: 'input',
      name: 'alias',
      message: 'Enter an alias for this favorite (optional)',
    });
    if (input.alias) {
      try {
        this.selected.alias = input.alias;
        await this.selected.save();
      } catch (e) {
        console.log(`${input.alias} is already taken, please input a different alias`);
        await this.editAlias();
      }
    }
  }
};