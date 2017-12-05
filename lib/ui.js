const blessed = require('blessed');
const clipboardy = require('clipboardy');
const fs = require('fs');
const rename = require('../rename');
const path = require('path');
const remark = require('remark');
const strip = require('./strip-markdown');
const yargs = require('yargs');
const yargsOptions = require('./yargsOptions');

// GLOBALS
let OPTIONS = Object.keys(yargsOptions)
  .filter(key => yargsOptions[key].showInUi)  
  .map(function(key) {
    let value = yargsOptions[key];
    if (value.showInUi) {
      return '-' + (key.length !== 1 ? '-' : '') + key + (value.alias ? ', --' + value.alias : '');
    }
  });
const REPLACEMENTS = rename.getReplacements();
let REPLACEMENT_LIST = Object.keys(REPLACEMENTS).map(function(key) { return '{{' + key + '}}'; });
let OPS;
let OPTS;
let README;

// ==========  UI ELEMENTS  ==========
let screen = blessed.screen({
  smartCSR: true,
  title: 'rename',
  cursor: {
    artificial: true,
    blink: true,
    shape: 'line'
  }
});

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

let commandInput = blessed.textbox({
  parent: inputBox,
  grabKeys: true,
  heigh: 1,
  left: 7,
  name: 'command'
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
  items: [...OPTIONS, ...REPLACEMENT_LIST],
  style: {
    selected: {
      inverse: false
    }
  }
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

let keyInfo = blessed.box({
  parent: screen,
  top: screen.height - 2,
  left: 0,
  width: '100%',
  content: '  Exit: CTRL-C or Escape    Switch between command and info: Tab    Show Readme: CTRL-R'
});
// ==========  END UI ELEMENTS  ==========

// ========== EVENT HANDLERS  ==========
inputBox.on('submit', function(form) {
  let theCommand = 'rename ' + form.command;
  inputBox.detach();
  infoBox.destroy();
  opList.destroy();
  keyInfo.destroy();
  let screen2text = blessed.box({
    parent: screen,
    top: 2,
    left: 'center',
    height: 4,
    width: '100%',
    tags: true
  });
  screen2text.setContent('{center}You entered the following command:\n' + theCommand + '\n\nWould would you like to do?{/center}');
  let whatNowBox = blessed.box({
    parent: screen,
    top: 6,
    left: 'center',
    height: screen.height - 7,
    width: 28
  });
  let whatNowList = blessed.list({
    parent: whatNowBox,
    scrollable: true,
    keys: true,
    items: ['Run the command', 'Copy command to clipboard', 'Exit without doing anything'],
    style: {
      selected: {
        inverse: true
      }
    }
  });
  whatNowList.focus();

  whatNowList.on('select', function() {
    if (whatNowList.selected === 0) {
      rename.run(OPS, OPTS, true);
    } else if (whatNowList.selected === 1) {
      clipboardy.writeSync(theCommand);
      process.exit(0);
    } else {
      process.exit(0);
    }
  });
});

commandInput.on('keypress', function(key) {
  if (key && key.full !== 'C-r') {
    setTimeout(updateOps, 1);
  }
});

commandInput.on('focus', function() {
  updateOps();
  commandInput.readInput();
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
  msg.display(helpText, 0, function() { msg.destroy(); });
});
// ========== END EVENT HANDLERS  ==========

// ==========  KEY HANDLERS  ==========
screen.key(['escape', 'C-c'], function() {
  return process.exit(0);
});

commandInput.key('tab', function() {
  infoList.style.selected = { inverse: true };
  infoList.focus();
});

commandInput.key('enter', function() {
  inputBox.submit();
});

commandInput.key(['escape', 'C-c', 'C-r'], function(ch, key) {
  if (key.name === 'r') {
    infoList.focus();
    setTimeout(showReadme, 100);
  } else {
    return process.exit(0);
  }
});

infoList.key('tab', function() {
  infoList.style.selected = { inverse: false };
  focusCommandInput();
});

infoList.key('C-r', function() {
  showReadme();
});

opList.key('C-r', function() {
  opList.setScroll(0);
  focusCommandInput();
  opList.title = 'operations';
});
// ==========  END KEY HANDLERS  ==========

// Read README file
fs.readFile(__dirname + '/../README.md', 'utf8', (err, data) => {
  if (!err) {
    remark()
      .use(strip)
      .process(data, function(error, file) {
        if (!error) {
          README = String(file).replace(/&lt;/g, '<').replace(/&#x3A;/g, ':').replace(/\\\*/g, '*').replace(/\\`/g, '');
        } else {
          README = 'Readme parse error';
        }
      });
  } else {
    README = 'Error reading Readme file';
  }
});

// Focus input element.
commandInput.focus();

// Render the screen.
screen.render();

// ==========  HELPER FUNCTIONS  ==========
function updateOps() {
  let value = commandInput.value.replace('\t', ''); // get rid of tabs
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
      OPTS = rename.argvToOptions(argv);
      operations = rename.getOperations(files, newFileName, OPTS);
      OPS = operations;
    } catch (ex) {
      if (ex === 'InvalidReplacementVariable') {
        operations = [{text: 'Invalid replacement variable'}];
      } else {
        operations = [{text: 'Invalid command'}];
      }
    }
  }
  
  let content = operations.map(function(value) { return value.text; }).join('\n');
  opList.setContent(content);
}

function showReadme() {
  infoList.style.selected = { inverse: false };
  opList.focus();
  opList.title = 'readme';
  opList.setContent(README);
  opList.setScroll(opList.height - 3);
}

function focusCommandInput() {
  let commandText = (commandInput.getValue() ? commandInput.getValue() : '');
  commandInput.text = commandInput.setValue(commandText.replace('\t', ''));
  commandInput.focus();
}