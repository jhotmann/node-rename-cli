const async = require('async');
const util = require('./util');

const { Operation } = require('./operation');
const { Options } = require('./options');

module.exports.Batch = class Batch {
  constructor(argv, options, sequelize) {
    this.command = process.argv;
    this.argv = argv;
    this.options = options || new Options(argv);
    this.sequelize = sequelize;
    this.operations = this.options.inputFiles.map(f => { return new Operation(f, this.options, this.sequelize); });
    this.batchId;
  }

  setCommand(commandString) {
    this.command = commandString.split(' ');
  }

  async complete() {
    await this.replaceVariables();
    await this.sort();
    await this.indexAndFindConflicts();
    await this.execute();
  }

  async replaceVariables() {
    await async.eachSeries(this.operations, async (operation) => { await operation.replaceVariables(); });
  }

  async sort() {
    if (this.options.sort) { // sort files
      if (this.options.sort.includes('alphabet')) {
        this.operations = this.operations.sort((a,b) => {
          if (a.inputFileString < b.inputFileString) return -1;
          if (a.inputFileString > b.inputFileString) return 1;
          return 0;
        });
      } else if (this.options.sort.includes('date-create')) this.operations = this.operations.sort((a,b) => { return b.fileData.date.create - a.fileData.date.create; });
      else if (this.options.sort.includes('date-modify')) this.operations = this.operations.sort((a,b) => { return b.fileData.date.modify - a.fileData.date.modify; });
      else if (this.options.sort.includes('size')) this.operations = this.operations.sort((a,b) => { return b.fileData.stats.size - a.fileData.stats.size; });
      if (this.options.sort.includes('reverse')) this.operations.reverse();
    }
  }

  async indexAndFindConflicts() {
    let outputPaths = this.operations.map(o => o.outputFileString);
    let uniqueOutputs = [...new Set(outputPaths)];
    await async.eachSeries(uniqueOutputs, async (d) => {
      // find the total operations that have this same output
      let filteredOps = this.operations.filter(o => o.outputFileString === d);
      if (filteredOps.length > 1 && this.options.verbose) console.log(`${filteredOps.length} operations have the same output path: ${d}`);
      for (let i = 0; i < filteredOps.length; i++) {
        // if this is a unique output, don't put an index
        if (filteredOps.length === 1) { filteredOps[i].setIndex(''); }
        // if there are multiple, append the index or put the index wherever {{i}}
        else { // going to have a file conflict
          if (this.options.noIndex) {
            filteredOps[i].setIndex('');
            filteredOps[i].setConflict(true);
          } else { // set the index to avoid a conflict
            filteredOps[i].setIndex(util.leftPad(i + 1, filteredOps.length, '0'));
          }
        }
      }
    });
  }

  async execute() {
    if (!this.options.simulate) { // create a batch in the database
      let batch = this.sequelize.models.Batch.build({ command: JSON.stringify(this.command), cwd: process.cwd() });
      await batch.save();
      this.batchId = batch.id;
    }
    // run the rename operations
    await async.eachSeries(this.operations, async (o) => await o.run(this.batchId));
  }
};