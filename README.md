<!--TODO document this https://apple.stackexchange.com/questions/40734/why-is-my-host-name-wrong-at-the-terminal-prompt-when-connected-to-a-public-wifi-->
# Rename-CLI
A cross-platform tool for renaming files quickly, especially multiple files at once.

*Note* Version 7 has big changes from version 6, if you are staying on version 6 you can find the old documentation [here](docs/README6.md)

![GIF preview](images/rename.gif)

![Build and Test](https://github.com/jhotmann/node-rename-cli/workflows/Build%20and%20Test/badge.svg?branch=master) ![NPM](https://img.shields.io/npm/dt/rename-cli?color=cb3837&label=npm%20downloads&logo=npm) ![Chocolatey](https://img.shields.io/chocolatey/dt/rename-cli?color=5c9fd8&label=chocolatey%20downloads&logo=chocolatey)

## Installation
The preferred installation method is through NPM or Homebrew

**NPM:** (sudo if necessary)
```sh
npm i -g rename-cli@beta
```

**Homebrew:**
```sh
brew tap jhotmann/rename-cli
brew install rename-cli
```

**Chocolatey:**  
Windows users can install the binary through [Chocolatey](https://chocolatey.org/) or download from the [Releases](https://github.com/jhotmann/node-rename-cli/releases) page if you don't want to install Node.

*Note: binary files are untested*

```sh
choco install rename-cli
```  

## Features
- Variable replacement and filtering of new file name (powered by [Nunjucks](https://mozilla.github.io/nunjucks/templating.html)) :new:
- Glob file matching
- Command history with ability to undo entire batches or individual operations and re-run batches :new:
- Ability to save commands as favorites to re-run them quickly :new:
- Customize by adding your own variables and filters
- Auto-indexing when renaming multiple files to the same name
- RegEx match/replace
- EXIF and ID3 tag support

## Usage
```rename [options] file(s) new-file-name```

Or simply type `rename` for an interactive CLI with live previews of rename operations.

*Note: Windows users (or anyone who wants to type one less letter) can username instead of rename since the rename command already exists in Windows*

The new file name does not need to contain a file extension. If you do not specify a file extension, the original file extension will be preserved.

*Note: if you include periods in your new file name, you should include a file extension to prevent whatever is after the last period from becoming the new extension. I recommend using `{{ext}}` (which includes the period) to preserve the original file extension.*

## Options
 ```-h```, ```--help```: Show help    
 ```-i```, ```--info```: View online help    
 ```-w```, ```--wizard```: Run a wizard to guide you through renaming files    
 ```-u```, ```--undo```: Undo previous rename operation        
 ```-k```, ```--keep```: Keep both files when new file name already exists (append a number)    
 ```-f```, ```--force```: Forcefully overwrite without prompt when new file name already exists and create any missing directories    
 ```-s```, ```--sim```: Simulate rename and just print new file names    
 ```-n```, ```--noindex```: Do not append an index when renaming multiple files    
 ```-d```, ```--ignoredirectories```: Do not rename directories    
 ```--sort```: Sort files before renaming. Parameter: `alphabet` (default), `date-create` (most recent first), `date-modified` (most recent first), `size` (biggest to smallest). Start the parameter with `reverse-` to reverse the sort order.  
 ```-p```, ```--prompt```: Print all rename operations to be completed and confirm before proceeding    
 ```--notrim```: Do not trim whitespace at beginning or end of output file name    
 ```--nomove ```: Do not move files if their new file name points to a different directory  
 ```--noext```: Do not automatically append a file extension if one isn't supplied (sometimes necessary if using a variable for an extension)  
 ```--createdirs```: Automatically create missing directories (cannot be used with `--nomove`)    
 ```--printdata```: Print the data available for a file  
 ```--history```: View previously run commands and undo, re-run, copy, and favorite them  
 ```--favorites```, ```--favourites```: View saved favorites and run or edit them. Optionally you can pass the ID or alias of a favorite to run it directly

## Built-in Variables
<details><summary>The new file name can contain any number of built-in and custom variables that will be replaced with their corresponding value. Expand for more info.</summary>
<p>

 `{{i}}` Index: The index of the file when renaming multiple files to the same name. If you do no include `{{i}}` in your new file name, the index will be appended to the end. Use the `--noindex` option to prevent auto-indexing.

 `{{f}}` File name: The original name of the file.

 `{{ext}}` File extension: The original extension of the file (with the `.`)

 `{{p}}` Parent directory: The name of the parent directory.

 `{{isDirectory}}` Is directory: true/false. Useful for conditionally adding a file extension to files and not directories with `{% if isDirectory %}...`

 `{{os.x}}` Operating System: Information about the OS/user. Replace `x` with `homedir`, `hostname`, `platform`, or `user`

 `{{date.x}}` Dates: Insert a date. Replace `x` with `current` (the current date/time), `create` (the file's created date/time), `access` (the file's last accessed date/time) or `modify` (the file's last modified date/time)

 `{{g}}` GUID: A pseudo-random globally unique identifier.

 `{{exif.x}}` EXIF: Photo EXIF Information. Replace `x` with `iso`, `fnum`, `exposure`, `date`, `width`, or `height`

 `{{id3.x}}` ID3: Gets ID3 tags from MP3 files. Replace `x` with `title`, `artist`, `album`, `track`, `totalTracks`, or `year`

You can also add your own variables. See the [Customize](#customize) section for more info.

</p>
</details>

## Filters and Examples
<details><summary>You can modify variable values by applying filters. Multiple filters can be chained together. Nunjucks, the underlying variable-replacement engine, has a large number of <a href="https://mozilla.github.io/nunjucks/templating.html#builtin-filters">filters available</a> and Rename-CLI has a few of its own. Expand for more info.</summary>
<p>

String case manipulation
  - `{{f|lower}}` - `Something Like This.txt → something like this.txt`
  - `{{f|upper}}` - `Something Like This.txt → SOMETHING LIKE THIS.txt`
  - `{{f|camel}}` - `Something Like This.txt → somethingLikeThis.txt`
  - `{{f|pascal}}` - `Something Like This.txt → SomethingLikeThis.txt`
  - `{{f|kebab}}` - `Something Like This.txt → something-like-this.txt`
  - `{{f|snake}}` - `Something Like This.txt → something_like_this.txt`

-----

`replace('something', 'replacement')` - replace a character or string with something else.

```sh
rename "bills file.pdf" "{{ f | replace('bill', 'mary') | pascal }}"

bills file.pdf → MarysFile.pdf
```

-----

`date` - format a date to a specific format, the default is `yyyyMMdd` if no parameter is passed. To use your own format, simply pass the format as a string parameter to the date filter. Formatting options can be found [here](https://www.unicode.org/reports/tr35/tr35-dates.html#Date_Field_Symbol_Table).

  ```sh
  rename *.txt "{{ date.current | date }}-{{f}}"

  a.txt → 20200502-a.txt
  b.txt → 20200502-b.txt
  c.txt → 20200502-c.txt

  rename *.txt "{{ date.current | date('MM-dd-yyyy') }}-{{f}}"

  a.txt → 05-02-2020-a.txt
  b.txt → 05-02-2020-b.txt
  c.txt → 05-02-2020-c.txt
  ```

  -----

`match(RegExp[, flags, group num/name])` - match substring(s) using a regular expression. The only required parameter is the regular expression (as a string), it also allows for an optional parameter `flags` (a string containing any or all of the flags: g, i, m, s, u, and y, more info [here](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/RegExp#Parameters)), and an optional parameter of the `group` number or name. *Named groups cannot be used with the global flag.*

```sh
rename *ExpenseReport* "archive/{{ f | match('^.+(?=Expense)') }}/ExpenseReport.docx" --createdirs

JanuaryExpenseReport.docx → archive/January/ExpenseReport.docx
MarchExpenseReport.docx → archive/March/ExpenseReport.docx
```

-----

`regexReplace(RegExp[, flags, replacement])` - replace the first regex match with the `replacement` string. To replace all regex matches, pass the `g` flag. `flags` and `replacement` are optional, the default value for replacement is an empty string.

```sh
rename test/* "{{ f | regexReplace('(^|e)e', 'g', 'E') }}"

test/eight.txt → Eight.txt
test/eighteen.txt → EightEn.txt
test/eleven.txt → Eleven.txt
```

-----

`padNumber(length)` - put leading zeroes in front of a number until it is `length` digits long. If `length` is a string, it will use the string's length.

```sh
rename Absent\ Sounds/* "{{id3.year}}/{{id3.artist}}/{{id3.album}}/{{ id3.track | padNumber(id3.totalTracks) }} - {{id3.title}}{{ext}}"

Absent Sounds/Am I Alive.mp3 → 2014/From Indian Lakes/Absent Sounds/05 - Am I Alive.mp3
Absent Sounds/Awful Things.mp3 → 2014/From Indian Lakes/Absent Sounds/07 - Awful Things.mp3
Absent Sounds/Breathe, Desperately.mp3 → 2014/From Indian Lakes/Absent Sounds/03 - Breathe, Desperately.mp3
Absent Sounds/Come In This Light.mp3 → 2014/From Indian Lakes/Absent Sounds/01 - Come In This Light.mp3
Absent Sounds/Fog.mp3 → 2014/From Indian Lakes/Absent Sounds/10 - Fog.mp3
Absent Sounds/Ghost.mp3 → 2014/From Indian Lakes/Absent Sounds/06 - Ghost.mp3
Absent Sounds/Label This Love.mp3 → 2014/From Indian Lakes/Absent Sounds/02 - Label This Love.mp3
Absent Sounds/Runner.mp3 → 2014/From Indian Lakes/Absent Sounds/08 - Runner.mp3
Absent Sounds/Search For More.mp3 → 2014/From Indian Lakes/Absent Sounds/09 - Search For More.mp3
Absent Sounds/Sleeping Limbs.mp3 → 2014/From Indian Lakes/Absent Sounds/04 - Sleeping Limbs.mp3
```

</p>
</details>

## Customize
<details><summary>You can expand upon and overwrite much of the default functionality by creating your own variables and filters. Expand for more info.</summary>
<p>

### Variables
The first time you run the rename command a file will be created at `~/.rename/userData.js`, this file can be edited to add new variables that you can access with `{{variableName}}` in your new file name. You can also override the built-in variables by naming your variable the same. The userData.js file contains some examples.

```js
// These are some helpful libraries already included in rename-cli
// All the built-in nodejs libraries are also available
// const exif = require('jpeg-exif'); // https://github.com/zhso/jpeg-exif
// const fs = require('fs-extra'); // https://github.com/jprichardson/node-fs-extra
// const n2f = require('num2fraction'); // https://github.com/yisibl/num2fraction
// const date-fns = require('date-fns'); // https://date-fns.org/

module.exports = function(fileObj, descriptions) {
  let returnData = {};
  let returnDescriptions = {};

  // Put your code here to add properties to returnData
  // this data will then be available in your output file name
  // for example: returnData.myName = 'Your Name Here';
  // or: returnData.backupDir = 'D:/backup';

  // Optionally, you can describe a variable and have it show when printing help information
  // add the same path as a variable to the returnDescriptions object with a string description
  // for example: returnDescriptions.myName = 'My full name';
  // or: returnDescriptions.backupDir = 'The path to my backup directory';

  if (!descriptions) return returnData;
  else return returnDescriptions;
};
```

The `fileObj` that is passed to the function will look something like this:

```
{
  i: '--FILEINDEXHERE--',
  f: 'filename',
  fileName: 'filename',
  ext: '.txt',
  isDirectory: false,
  p: 'parent-directory-name',
  parent: 'parent-directory-name',
  date: {
    current: 2020-11-25T17:41:58.303Z,
    now: 2020-11-25T17:41:58.303Z,
    create: 2020-11-24T23:38:25.455Z,
    modify: 2020-11-24T23:38:25.455Z,
    access: 2020-11-24T23:38:25.516Z
  },
  os: {
    homedir: '/Users/my-user-name',
    platform: 'darwin',
    hostname: 'ComputerName.local',
    user: 'my-user-name'
  },
  guid: 'fb274642-0a6f-4fe6-8b07-0bac4db5c87b',
  customGuid: [Function: customGuid],
  stats: Stats {
    dev: 16777225,
    mode: 33188,
    nlink: 1,
    uid: 501,
    gid: 20,
    rdev: 0,
    blksize: 4096,
    ino: 48502576,
    size: 1455,
    blocks: 8,
    atimeMs: 1606261105516.3499,
    mtimeMs: 1606261105455.4163,
    ctimeMs: 1606261105486.9072,
    birthtimeMs: 1606261105455.093,
    atime: 2020-11-24T23:38:25.516Z,
    mtime: 2020-11-24T23:38:25.455Z,
    ctime: 2020-11-24T23:38:25.487Z,
    birthtime: 2020-11-24T23:38:25.455Z
  },
  parsedPath: {
    root: '/',
    dir: '/Users/my-user-name/Projects/node-rename-cli',
    base: 'filename.txt',
    ext: '.txt',
    name: 'filename'
  },
  exif: { iso: '', fnum: '', exposure: '', date: '', width: '', height: '' },
  id3: {
    title: '',
    artist: '',
    album: '',
    year: '',
    track: '',
    totalTracks: ''
  }
}
```

### Filters
The first time you run the rename command a file will be created at `~/.rename/userFilters.js`, this file can be edited to add new filters that you can access with `{{someVariable | myNewFilter}}` in your new file name.

One place custom filters can be really handy is if you have files that you often receive in some weird format and you then convert them to your own desired format. Instead of writing some long, complex new file name, just write your own filter and make the new file name `{{f|myCustomFilterName}}`. You can harness the power of code to do really complex things without having to write a complex command.

Each filter should accept a parameter that contains the value of the variable passed to the filter (`str` in the example below). You can optionally include more of your own parameters as well. The function should also return a string that will then be inserted into the new file name (or passed to another filter if they are chained). The userFilters.js file contains some examples.

```js
// Uncomment the next line to create an alias for any of the default Nunjucks filters https://mozilla.github.io/nunjucks/templating.html#builtin-filters
// const defaultFilters = require('../nunjucks/src/filters');
// These are some helpful libraries already included in rename-cli
// All the built-in nodejs libraries are also available
// const exif = require('jpeg-exif'); // https://github.com/zhso/jpeg-exif
// const fs = require('fs-extra'); // https://github.com/jprichardson/node-fs-extra
// const n2f = require('num2fraction'); // https://github.com/yisibl/num2fraction
// const { format } = require('date-fns'); // https://date-fns.org/

module.exports = {
  // Create an alias for a built-in filter
  // big: defaultFilters.upper,
  // Create your own filter
  // match: function(str, regexp, flags) {
  //   if (regexp instanceof RegExp === false) {
  //     regexp = new RegExp(regexp, flags);
  //   }
  //   return str.match(regexp);
  // }
};
```

</p>
</details>