const async = require('async');
const fs = require('fs-extra');
const globby = require("globby");
const path = require('path');

module.exports.Options = class Options {
  constructor(argv) {
    this.argv = argv;
    this.compiled = (argv['$0'] && argv['$0'].indexOf('rname.exe') > -1);
    this.info = getBooleanValue(argv, 'i', 'info');
    this.help = getBooleanValue(argv, 'h', 'help');
    this.force = getBooleanValue(argv, 'f', 'force');
    this.keep = getBooleanValue(argv, 'k', 'keep');
    this.simulate = getBooleanValue(argv, 's', 'sim');
    this.verbose = getBooleanValue(argv, 'v', 'verbose');
    this.noIndex = getBooleanValue(argv, 'n', 'noindex');
    this.noTrim = getBooleanValue(argv, '', 'notrim');
    this.ignoreDirectories = getBooleanValue(argv, 'd', 'ignoredirectories');
    this.noMove = getBooleanValue(argv, '', 'nomove');
    this.createDirs = getBooleanValue(argv, '', 'createdirs');
    this.noExt = getBooleanValue(argv, '', 'noext');
    this.history = getBooleanValue(argv, '', 'history');
    this.favorites = getBooleanValue(argv, '', 'favorites');
    this.undo = getBooleanValue(argv, 'u', 'undo');
    this.noUndo = getBooleanValue(argv, '', 'noundo');
    this.wizard = getBooleanValue(argv, 'w', 'wizard');
    this.printdata = getBooleanValue(argv, '', 'printdata');
    this.sort = getSortOption(argv);
    if (argv._.length > 0) {
      this.inputFiles = [];
      if (argv._.length > 1) this.outputPattern = argv._.pop().replace(/^"|"$/g, '');
      else this.outputPattern = '';
      for (const file of argv._) {
        if (globby.hasMagic(file)) {
          for (const globMatch of globby.sync(file, { onlyFiles: false })) {
            this.inputFiles.push(path.resolve(globMatch));
          }
        } else {
          this.inputFiles.push(path.resolve(file));
        }
      }
    } else {
      this.outputPattern = '';
      this.inputFiles = [];
    }
    this.invalidInputFiles = 0;
  }

  async validateInputFiles() {
    const originalLength = this.inputFiles.length;
    this.inputFiles = await async.filterSeries(this.inputFiles, async (i) => { return (null, await fs.pathExists(i)); });
    if (this.inputFiles.length !== originalLength) {
      this.invalidInputFiles = originalLength - this.inputFiles.length;
      if (this.verbose) console.log(`${this.invalidInputFiles} file${this.invalidInputFiles === 1 ? '' : 's'} will be skipped because ${this.invalidInputFiles === 1 ? 'it does' : 'they do'} not exist`);
    }
  }
};

function getBooleanValue(argv, shortName, longName) {
  if (shortName && argv.hasOwnProperty(shortName)) {
    return argv[shortName];
  } else if (longName && argv.hasOwnProperty(longName)) {
    return argv[longName];
  }
  return false;
}

function getSortOption(argv) {
  let sort = argv.sort || 'none';
  if (sort === 'none') return false;
  if (sortOptions.hasOwnProperty(sort)) {
    return sortOptions[sort];
  }
  return false;
}

const sortOptions = {
  "alphabet": "alphabet",
  "date-create": "date-create",
  "date-modified": "date-modified",
  "size": "size",
  "reverse-alphabet": "reverse-alphabet",
  "reverse-date-create": "reverse-date-create",
  "reverse-date-modified": "reverse-date-modified",
  "reverse-size": "reverse-size"
};

module.exports.sortOptions = sortOptions;