const clipboardy = require('clipboardy');
const opn = require('opn');
const os = require('os');
const path = require('path');
const term = require('terminal-kit').terminal;
const traverse = require('traverse');
const yargs = require('yargs');
const yargsOptions = require('../lib/yargsOptions');

const { Batch } = require('./batch');
const { FileData } = require('./fileData');

let TIMEOUT;
let REFRESH = true;
let BATCH;

module.exports = async function(sequelize) {
  let fo = path.resolve(__filename);
  let foFileData = new FileData(fo, { noIndex: false });
  let allData = await foFileData.get();
  let variableNames = traverse.paths(allData).map(p => {
    if (p.length === 1 && typeof allData[p[0]] !== "object") {
      return p[0];
    } else if (p.length > 1) {
      return p.join('.');
    }
  }).filter(p => p !== undefined);
  term.fullscreen(true);
  term('rename ');
  setHelpText();

  let inputField = term.inputField({cancelable: true}, function (error, input) {
    if (!error && input) {
      if (TIMEOUT) clearTimeout(TIMEOUT);
      REFRESH = false;
      term.clear();
      inputField.abort();
      setTimeout(inputSubmitted, 100, input);
    }
  });

  term.on('key', function (name) {
    if (['CTRL_C', 'ESC'].indexOf(name) > -1) {
      terminate();
    } else if (name === 'CTRL_H') {
      opn('https://github.com/jhotmann/node-rename-cli');
      if (process.platform !== 'win32') {
        process.exit(0);
      }
    } else if (REFRESH) {
      if (TIMEOUT) clearTimeout(TIMEOUT);
      TIMEOUT = setTimeout(updateCommands, 500);
    }
  });
  
  async function inputSubmitted(input) {
    let theCommand = (os.platform() === 'win32' ? 'rname ' :'rename ') + input;
    term.moveTo(1,1, '\nYou entered the following command:\n\n  ' + theCommand + '\n\nWhat would you like to do?');
    term.singleColumnMenu(['Run the command', 'Copy command to clipboard', 'Exit without doing anything'], {cancelable: false}, async function(error, selection) {
      term.clear();
      if (selection.selectedIndex === 0) {
        BATCH.setCommand(theCommand);
        await BATCH.complete();
        process.exit(0);
      } else if (selection.selectedIndex === 1) {
        await clipboardy.write(theCommand);
        process.exit(0);
      } else {
        process.exit(0);
      }
    });
  }
  
  async function updateCommands() {
    let variableMatch = inputField.getInput().match('{{\\s*([A-z.]*)$');
    if (variableMatch) {
      let matchingVars = variableNames.filter(v => v.startsWith(variableMatch[1])).join(', ');
      setHelpText('Variables: ' + matchingVars);
    } else {
      setHelpText();
    }
    term.saveCursor();
    term.eraseArea(1, 2, term.width, term.height - 2);
    term.moveTo(1, 3, 'working...');
    let value = inputField.getInput();
    let argv = yargs
      .options(yargsOptions)
      .parse(value);
    BATCH = new Batch(argv, null, sequelize);
    let content;
    try {
      await BATCH.replaceVariables();
      content = BATCH.operations.map((o) => { return o.getOperationText(); });
    } catch (ex) {
      content = ['Invalid command'];
    }
    
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
  
  function setHelpText(helpText, center) {
    if (helpText === undefined) {
      helpText = 'Rename-CLI v' + require('../package.json').version + '    Type CTRL-H to view online help';
      center = true;
    }
    term.saveCursor();
    let helpTextX;
    if (center && helpText.length < term.width) helpTextX = (term.width / 2) - (helpText.length / 2);
    else helpTextX = 1;
    helpText = truncate(helpText);
    term.moveTo(helpTextX, term.height).eraseLine().moveTo(helpTextX, term.height, helpText);
    term.restoreCursor();
  }
  
  function terminate() {
    term.grabInput(false);
    setTimeout(function () {
      process.exit(0);
    }, 100);
  }
};