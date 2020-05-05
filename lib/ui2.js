const clipboardy = require('clipboardy');
const opn = require('opn');
const os = require('os');
const path = require('path');
const pathExists = require('path-exists');
const rename = require('../rename');
const term = require('terminal-kit').terminal;
const traverse = require('traverse');
const yargs = require('yargs');
const yargsOptions = require('./yargsOptions');

const defaultData = require('../lib/data');
let userData;
if (pathExists.sync(os.homedir() + '/.rename/userData.js')) {
  userData = require(os.homedir() + '/.rename/userData.js');
} else {
  userData = function() { return {}; };
}
let fo = path.parse(__filename);
let defaultVars = defaultData(fo);
let userVars = userData(fo);
let allData = Object.assign(defaultVars, userVars);
console.dir(allData);
let variableNames = traverse.paths(allData).map(p => {
  console.dir(p);
  if (p.length === 1 && typeof allData[p[0]] !== "object") {
    return p[0];
  } else if (p.length > 1) {
    return p.join('.');
  }
}).filter(p => p !== undefined);

let to;
let refresh = true;
let OPS;
let OPTS;

function terminate() {
  term.grabInput(false);
  // setTimeout(function () {
  //   process.exit();
  // }, 100);
}

term.on('key', function (name, matches, data) {
  if (['CTRL_C', 'ESC'].indexOf(name) > -1) {
    terminate();
  } else if (name === 'CTRL_H') {
    opn('https://github.com/jhotmann/node-rename-cli');
    if (process.platform !== 'win32') {
      process.exit(0);
    }
  } else if (refresh) {
    if (to) clearTimeout(to);
    to = setTimeout(updateCommands, 500);
  }
});

term.fullscreen(true);
term('rename ');
term.saveCursor();
let helpText = 'Rename-CLI v' + require('../package.json').version + '    Type CTRL-H to view online help';
let helpTextX = (term.width / 2) - (helpText.length / 2);
term.moveTo(helpTextX, term.height, helpText);
term.restoreCursor();

let inputField = term.inputField({cancelable: true},
  function (error, input) {
    if (input) {
      if (to) clearTimeout(to);
      refresh = false;
      term.clear();
      inputField.abort();
      setTimeout(inputSubmitted, 100, input);
    }
  }
);

function updateCommands() {
  term.saveCursor();
  term.eraseArea(1, 2, term.width, term.height - 2);
  term.moveTo(1, 3, 'working...');
  let value = inputField.getInput();
  let argv = yargs
    .options(yargsOptions)
		.parse(value);
  let files = [];
  let newFileName = '';
  OPS = [];
  if (argv._.length > 1) {
    try {
      newFileName = path.parse(argv._.pop());
      files = rename.getFileArray(argv._);
      OPTS = rename.argvToOptions(argv);
      OPS = rename.getOperations(files, newFileName, OPTS);
    } catch (ex) {
      if (ex === 'InvalidReplacementVariable') {
        OPS = [{text: 'Invalid replacement variable'}];
      } else {
        OPS = [{text: 'Invalid command'}];
      }
    }
  }
  
  let content = OPS.map(function(value) { return value.text; });
  let trimmedContent = [];
  if (content.length > (term.height - 5)) {
    trimmedContent = content.slice(0, term.height - 5);
    trimmedContent.push('+' + (content.length - trimmedContent.length) + ' more...');
  }
  else trimmedContent = content;
  term.eraseArea(1, 2, term.width, term.height - 2);
  term.moveTo(1, 3, trimmedContent.map(truncate).join('\n'));
  term.restoreCursor();
}

function truncate(op) {
  if (op.length > term.width) {
    return op.substring(0, term.width - 3) + '...';
  }
  return op;
}

function inputSubmitted(input) {
  let theCommand = 'rename ' + input;
  term.moveTo(1,1, '\nYou entered the following command:\n\n  ' + theCommand + '\n\nWhat would you like to do?');
  term.singleColumnMenu(['Run the command', 'Copy command to clipboard', 'Exit without doing anything'], {cancelable: false}, function(error, selection) {
    term.clear();
    if (selection.selectedIndex === 0) {
      rename.run(OPS, OPTS, true);
    } else if (selection.selectedIndex === 1) {
      clipboardy.writeSync(theCommand);
      process.exit(0);
    } else {
      process.exit(0);
    }
  });
}
