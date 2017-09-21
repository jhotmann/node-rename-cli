const _ = require('lodash');
const blessed = require('blessed');
const fs = require('fs');
const index = require('../index');
const path = require('path');
const remark = require('remark');
const strip = require('./strip-markdown');
const yargs = require('yargs');
const yargsOptions = require('./yargsOptions');

// Globals
let OPS;
let OPTIONS = [];
_.forEach(yargsOptions, function(value, key) {
  if (value.showInUi) {
    OPTIONS.push('-' + (key.length !== 1 ? '-' : '') + key + (value.alias ? ', --' + value.alias : ''));
  }
});
const REPLACEMENTS = index.getReplacements();
let REPLACEMENT_LIST = [];
_.each(REPLACEMENTS, function(value, key) {
  REPLACEMENT_LIST.push('{{' + key + '}}');
});
let SHOW_README = false;
let README;
fs.readFile(__dirname + '/../README.md', 'utf8', (err, data) => {
  if (!err) {
    remark()
      .use(strip)
      .process(data, function(error, file) {
        if (!error) {
          README = String(file);
        } else {
          README = 'Readme parse error';
        }
      });
  } else {
    README = 'Error reading Readme file';
  }
});


let screen = blessed.screen({
  smartCSR: true,
  cursor: {
    artificial: true,
    blink: true,
    shape: 'line'
  }
});

screen.title = 'rename';

let inputBox = blessed.form({
  parent: screen,
  label: 'command',
  top: 0,
  left: 0,
  width: '70%',
  height: 3,
  content: 'rename ',
  border: {type: 'line'},
  cursor: 'line'
});

inputBox.on('submit', function(form) {
  // Prompt for what to do next
});

let commandInput = blessed.textbox({
  parent: inputBox,
  grabKeys: true,
  heigh: 1,
  left: 7,
  name: 'command'
});

commandInput.on('focus', function() {
  updateOps();
  commandInput.readInput();
});

commandInput.key('tab', function(ch, key) {
  infoList.style.selected = { inverse: true };
  infoList.focus();
});

commandInput.key('C-r', function(ch, key) {
  infoList.focus();
  showReadme();
});

commandInput.key('enter', function(ch, key) {
  inputBox.submit();
});

let infoBox = blessed.box({
  parent: screen,
  top: 0,
  left: '70%',
  width: '30%',
  height: screen.height - 3,
  border: {type: 'line'},
  scrollable: true,
  label: 'info'
});

let infoList = blessed.list({
  parent: infoBox,
  scrollable: true,
  keys: true,
  items: _.concat(OPTIONS, REPLACEMENT_LIST),
  style: {
    selected: {
      inverse: false
    }
  }
});

infoList.key('tab', function(ch, key) {
  infoList.style.selected = { inverse: false };
  focusCommandInput();
});

infoList.key('C-r', function(ch, key) {
  showReadme();
});

infoList.on('select', function() {
  let helpText = '';
  let boxTitle = '';
  let selected = infoList.selected;
  if (selected < OPTIONS.length) {
    let optionKey = OPTIONS[selected].split(',')[0].replace(/\W/g, '');
    helpText = yargsOptions[optionKey].describe;
    boxTitle = optionKey + ' option';
  } else {
    let replacementObj = REPLACEMENTS[Object.keys(REPLACEMENTS)[selected - OPTIONS.length]];
    helpText = replacementObj.description;
    boxTitle = replacementObj.name + ' Variable';
    if (replacementObj.parameters) {
      helpText += '\n\nParameters: ' + replacementObj.parameters.description;
    }
  }
  helpText += '\n\n{center}Press space to close{/center}';

  let msg = blessed.message({
    parent: screen,
    label: boxTitle,
    border: 'line',
    height: 'shrink',
    width: 'half',
    top: 'center',
    left: 'center',
    tags: true,
    keys: true
  });
  msg.display(helpText, 0, function(err) { msg.destroy(); });
});

let opList = blessed.box({
  parent: screen,
  scrollable: true,
  scrollbar: {
    inverse: true
  },
  keys: true,
  top: 3,
  left: 0,
  width: '70%',
  height: screen.height - 6,
  border: 'line',
  label: 'operations'
});

opList.key('C-r', function(ch, key) {
  opList.setScroll(0);
  focusCommandInput();
  opList.title = 'operations';
});

let keyInfo = blessed.box({
  parent: screen,
  top: screen.height - 2,
  left: 0,
  width: '100%',
  content: '  Exit: CTRL-C or Escape    Switch between command and info: Tab    View README: CTRL-R'
});

// Quit on Escape or Control-C.
screen.key(['escape', 'C-c'], function(ch, key) {
  return process.exit(0);
});
commandInput.key(['escape', 'C-c'], function(ch, key) {
  return process.exit(0);
});

// Focus our element.
commandInput.focus();

// Render the screen.
screen.render();

commandInput.on('keypress', function(key) {
  setTimeout(updateOps, 1);
});

function updateOps() {
  let value = commandInput.value.replace('\t', ''); // get rid of tabs
  let argv = yargs
    .options(yargsOptions)
		.parse(value);
		
  let files = [];
  let newFileName = '';
  let options = {
    regex: (argv.r ? argv.r : false),
    keep: (argv.k ? true : false),
    force: (argv.f ? true : false),
    simulate: (argv.s ? true : false),
    verbose: (argv.v ? true : false),
    noIndex: (argv.n ? true : false),
    noTrim: (argv.notrim ? true : false)
  };
  let operations = [];
  if (argv._.length > 1) {
    try {
      files = index.getFileArray(_.dropRight(argv._));
      newFileName = path.parse(_.last(argv._));
      operations = index.getOperations(files, newFileName, options);
      OPS = operations;
    } catch (ex) {
      operations = [{text: 'Invalid command'}];
      OPS = null;
    }
  }
  
  let content = '';
  _.forEach(operations, function(value) {
    content += value.text + '\n';
  });
  opList.setContent(content);
}

function showReadme() {
  infoList.style.selected = { inverse: false };
  opList.title = 'readme';
  opList.setContent(README);
  opList.focus();
}

function focusCommandInput() {
  let commandText = (commandInput.getValue() ? commandInput.getValue() : '');
  commandInput.text = commandInput.setValue(commandText.replace('\t', ''));
  commandInput.focus();
}