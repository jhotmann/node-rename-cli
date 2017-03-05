/*  Custom String Replacement Variables for rename-cli

    These replacement variables will take precidence over any built-in
    replacements with the same name, so if you do not like the functionality
    you can override them as desired. Here is an example of what the constant
    replacements should look like:

    const replacements = {
      '{{i}}': {
        name: 'Index',
        description: 'The index of the file when renaming multiple files',
        unique: true,
        function: function(fileObj) {
          return fileObj.index;
        }
      },
      '{{f}}': {
        name: 'File name',
        description: "The original name of the file",
        unique: true,
        function: function(fileObj) {
          return fileObj.name;
        }
      },
      '{{x}}': {
        name: 'My new replacement',
        description: "Returns the word 'test'",
        unique: false,
        function: function(fileObj) {
          return 'test';
        }
      }
    };

    Each key in replacements is a string that when found in the output file name
    will replace that string with the return value of its function child key.
    The name and description child keys will be shown when you type rename -h
    so they should be descriptive enough to remind you of their function. The
    subkey unique should be true when the resulting output of the function will
    give the output file a unique name, otherwise set it to false so that an
    index will be appended to the output file to avoid conflicts when renaming
    multiple files at once. The function child key will be passed an object
    containing the current file's details. It looks like this:

    { 
      root: '/',
      dir: '/path/to/directory/of/file',
      base: 'filename.ext',
      ext: '.ext',
      name: 'filename',
      newName: 'new-file-name',
      newNameExt: '.ext',
      index: '29'
    }

    You can then use these properties if desired in your functions. See the
    default variable replacements here:
    https://github.com/jhotmann/node-rename-cli/blob/master/replacements.js
    
    And don't forget you can test your new replacements by using the --s option
    when running the reanme command.
*/

const replacements = {};

module.exports = replacements;