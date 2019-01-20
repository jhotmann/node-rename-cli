/*  Custom String Replacement Variables for rename-cli

    These replacement variables will take precidence over any built-in
    replacements with the same name, so if you do not like the functionality
    you can override them as desired. Here is an example of what the constant
    replacements should look like:

    const replacements = {
      'i': {
        name: 'Index',
        description: 'The index of the file when renaming multiple files',
        parameters: {
          description: 'starting index, default is 1',
          default: '1'
        },
        unique: true,
        function: function(fileObj, args) {
          let newIndex = parseInt(args) - 1 + parseInt(fileObj.index);
          let totalFiles = parseInt(args) - 1 + parseInt(fileObj.totalFiles);
          return fileIndexString(totalFiles, newIndex);
        }
      },
      'f': {
        name: 'File name',
        description: "The original name of the file",
        parameters: {
          description: 'upper, lower, camel, pascal, or blank',
          default: ''
        },
        unique: true,
        function: function(fileObj, args) {
          switch (args) {
            case 'upper':
              return fileObj.name.toUpperCase();
            case 'lower':
              return fileObj.name.toLowerCase();
            case 'camel':
              return fileObj.name.toLowerCase().replace(/(?:^\w|[A-Z]|\b\w)/g, function(letter, index) {
                return index === 0 ? letter.toLowerCase() : letter.toUpperCase();
              }).replace(/[\s\-_\.]+/g, '');
            case 'pascal':
              return fileObj.name.toLowerCase().replace(/(?:^\w|[A-Z]|\b\w)/g, function(letter) {
                return letter.toUpperCase();
              }).replace(/[\s\-_\.]+/g, '');
            default:
              return fileObj.name;
          }
        }
      },
      'x': {
        name: 'My new replacement',
        description: "Returns the word 'test'",
        unique: false,
        function: function(fileObj, args) {
          return 'test';
        }
      }
    };

    Each key in replacements is a string that when found between curly brackets
    {{}} in the output file name will be replaced with the return value of its
    function child key. The name and description child keys will be shown when
    you type 'rename -h' so they should be descriptive enough to remind you of
    their function. The subkey 'unique' should be true when the resulting output
    of the function will give the output file a unique name, otherwise set it to
    false so that an index will be appended to the output file to avoid
    conflicts when renaming multiple files at once. The 'parameters' subkey is
    optional and contains a description shown in the variable help and a default
    value for when no parameter is supplied. The function child key will be
    passed an object containing the current file's details and a parameter string.
    The object passed to the function looks like this:

    { 
      root: '/',
      dir: '/path/to/directory/of/file',
      base: 'filename.ext',
      ext: '.ext',
      name: 'filename',
      newName: 'new-file-name',
      newNameExt: '.ext',
      index: '29',
      regexMatches: ['match1', 'match2', ...],
      regexPatterns: [/SomeRegEx/g],
      totalFiles: '50'
      options: {
        regex: boolean,
        keep: boolean,
        force: boolean,
        simulate: boolean,
        verbose: boolean,
        noIndex: boolean,
        noTrim: boolean }
      }
    }

    Note: regexMatches and regexPatterns are only present when the -r option is used, so be sure
    to check if they exist before proceeding.

    You can then use these properties if desired in your functions. See the
    default variable replacements here:
    https://github.com/jhotmann/node-rename-cli/blob/master/replacements.js
    
    And don't forget you can test your new replacements by using the -s option
    when running the reanme command.
*/

const replacements = {};

module.exports = replacements;