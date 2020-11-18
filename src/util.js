const traverse = require('traverse');
const { FileData } = require('./fileData');

module.exports = {};

module.exports.leftPad = function(input, desiredLength, padChar) {
  let totString = '' + desiredLength;
  let returnString = '' + input;
  while (returnString.length < totString.length) {
    returnString = padChar + returnString;
  }
  return returnString;
};

module.exports.argvToString = function(argv) {
  let returnString = '';
  let args = argv;
  if (argv[0].match(/.*[/\\]node(.exe)?$/)) {
    args = argv.slice(2);
    returnString += 'rename ';
  }
  for (const component of args) {
    returnString += `${component.match(/.*[ |].*/) ? '"' : ''}${component}${component.match(/.*[ |].*/) ? '"' : ''} `;
  }
  return returnString.trim();
};

module.exports.yargsArgvToString = function(argv) {
  let filesArr = argv._.map(function(value) { return escapeText(value); });
  let command = (process.platform === 'win32' ? 'rname' : 'rename') + 
    (argv.f ? ' -f' : '') +
    (argv.noindex ? ' -n' : '') +
    (argv.d ? ' -d' : '') +
    (argv.v ? ' -v' : '') +
    (argv.createdirs ? ' --createdirs' : '') +
    (argv.nomove ? ' --nomove' : '') + ' ' +
    filesArr.join(' ');
  return command;
};

module.exports.getVariableList = function () {
  const tempFileData = new FileData(__filename, {noIndex: true});
  let defaultVars = tempFileData.getDescriptions();
  return traverse.paths(defaultVars).map(v => {
    if (v.length === 1 && typeof defaultVars[v[0]] !== "object") {
      return '{{' + v[0] + '}}' + ' - ' + defaultVars[v[0]];
    } else if (v.length > 1) {
      let p = v.join('.');
      let value;
      v.forEach(val => {
        if (!value) value = defaultVars[val];
        else value = value[val];
      });
      return '{{' + p + '}}' + ' - ' + value;
    }
  }).filter(v => v !== undefined).join('\n\n');
};

function escapeText(theString) {
  if (theString.indexOf(' ') > -1 || theString.indexOf('|') > -1) {
    return '"' + theString + '"';
  }
  return theString;
}