const clipboardy = require('clipboardy');
const fs = require('fs-extra');
const os = require('os');
const path = require('path');
const pathExists = require('path-exists');
const rename = require('../rename');
const term = require('terminal-kit').terminal;
const yargs = require('yargs');
const yargsOptions = require('./yargsOptions');

let to;

function terminate() {
  term.grabInput(false);
  setTimeout(function () {
    process.exit();
  }, 100);
}

term.on('key', function (name, matches, data) {
  if (['CTRL_C', 'ESC'].indexOf(name) > -1) {
    terminate();
  } else {
    if (to) clearTimeout(to);
    to = setTimeout(updateCommands, 500);
  }
});

term.fullscreen(true);
term('rename ');
term.saveCursor();
let helpText = 'CTRL-V to show variables    CTRL-F to show filters';
let helpTextX = (term.width / 2) - (helpText.length / 2);
term.moveTo(helpTextX, term.height - 1, helpText);
term.restoreCursor();

let inputField = term.inputField({cancelable: true},
  function (error, input) {
    if (input) {
      term.green("\nYour name is '%s'\n", input);
    }
    process.exit();
  }
);

function updateCommands() {
  term.saveCursor();
  term.eraseArea(1, 2, term.width, term.height - 3);
  term.moveTo(1, 3, 'working...');
  let value = inputField.getInput();
  let argv = yargs
    .options(yargsOptions)
		.parse(value);
  let files = [];
  let newFileName = '';
  let operations = [];
  if (argv._.length > 1) {
    try {
      newFileName = path.parse(argv._.pop());
      files = rename.getFileArray(argv._);
      let opts = rename.argvToOptions(argv);
      operations = rename.getOperations(files, newFileName, opts);
    } catch (ex) {
      if (ex === 'InvalidReplacementVariable') {
        operations = [{text: 'Invalid replacement variable'}];
      } else {
        operations = [{text: 'Invalid command'}];
      }
    }
  }
  
  let content = operations.map(function(value) { return value.text; });
  let trimmedContent;
  if (content.length > (term.height - 6)) {
    trimmedContent = content.slice(0, term.height - 6);
    trimmedContent.push('+' + (content.length - trimmedContent.length) + ' more...');
  }
  else trimmedContent = content;
  term.moveTo(1, 3, trimmedContent.map(truncate).join('\n'));
  term.restoreCursor();
}

function truncate(op) {
  if (op.length > term.width) {
    return op.substring(0, term.width - 3) + '...';
  }
  return op;
}
