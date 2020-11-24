// Object containing all yargs options http://yargs.js.org/docs/#api-optionskey-opt
// showInUi is an added boolean that controls if the option shows in the UI Info List

module.exports = {
  'h': {
    boolean: true,
    alias: 'help',
    showInUi: false
  }, 'i': {
    alias: 'info',
    boolean: true,
    describe: 'View online help',
    showInUi: false
  }, 'w': {
    alias: 'wizard',
    boolean: true,
    describe: 'Run a wizard to guide you through renaming files',
    showInUi: false
  }, 'u': {
    alias: 'undo',
    boolean: true,
    describe: 'Undo previous rename operation',
    showInUi: false
  }, 'k': {
    alias: 'keep',
    boolean: true,
    describe: 'Keep both files when output file name already exists (append a number)',
    showInUi: true
  }, 'f': {
    alias: 'force',
    boolean: true,
    describe: 'Force overwrite without prompt when output file name already exists and create missing directories',
    showInUi: true
  }, 's': {
    alias: 'sim',
    boolean: true,
    describe: 'Simulate rename and just print new file names',
    showInUi: true
  }, 'n': {
    alias: 'noindex',
    boolean: true,
    describe: 'Do not append an index when renaming multiple files',
    showInUi: true
  }, 'd': {
    alias: 'ignoredirectories',
    boolean: true,
    describe: 'Do not rename directories',
    showInUi: true
  }, 'sort': {
    boolean: false,
    string: true,
    choices: ['none', 'alphabet', 'reverse-alphabet', 'date-create', 'reverse-date-create', 'date-modified', 'reverse-date-modified', 'size', 'reverse-size'],
    default: 'none',
    describe: 'Sort files before renaming.',
    showInUi: true
  }, 'v': {
    alias: 'verbose',
    boolean: true,
    describe: 'Prints all rename operations as they occur',
    showInUi: true
  }, 'notrim': {
    boolean: true,
    describe: 'Do not trim whitespace at beginning or end of ouput file name',
    showInUi: true
  }, 'nomove': {
    boolean: true,
    describe: 'Do not move files if their new file name points to a different directory',
    showInUi: true
  }, 'noext': {
    boolean: true,
    describe: 'Do not automatically append a file extension if one isn\'t supplied (may be necessary if using a variable for an extension)',
    showInUi: true
  }, 'createdirs': {
    boolean: true,
    describe: 'Automatically create missing directories',
    showInUi: true
  }, 'printdata': {
    boolean: true,
    describe: 'Print the data available for a file',
    showInUi: false
  }, 'noundo': {
    boolean: true,
    describe: 'Don\'t write an undo file',
    showInUi: false
  }, 'history': {
    boolean: false,
    number: true,
    describe: 'View previous commands. Optional Parameter: the number of previous commands to fetch.',
    showInUi: false
  }, 'favorites': {
    boolean: false,
    string: true,
    alias: 'favourites',
    describe: 'View saved favorites. Optional Parameter: the id or alias of the favorite to run.',
    showInUi: false
  }
};

/* this option was lost at some point
'p': {
    alias: 'prompt',
    boolean: true,
    describe: 'Print all rename operations to be completed and confirm before proceeding',
    showInUi: true
  }, 
*/