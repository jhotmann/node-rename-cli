<!--TODO document this https://apple.stackexchange.com/questions/40734/why-is-my-host-name-wrong-at-the-terminal-prompt-when-connected-to-a-public-wifi-->
# Rename-CLI
A cross-platform tool for renaming files quickly, especially multiple files at once.

*Note* Version 7 has big changes from version 6, if you are staying on version 6 you can find the old documentation [here](docs/README6.md)

![gif preview](images/rename.gif)

![Build and Test](https://github.com/jhotmann/node-rename-cli/workflows/Build%20and%20Test/badge.svg?branch=7.0.0)

## Installation

npm: `npm i -g rename-cli` (sudo if necessary)  
chocolatey: `coming soon!`  
homebrew: `coming soon!`

## Features
- Variable replacement and filtering of new file name (powered by [Nunjucks](https://mozilla.github.io/nunjucks/templating.html))
- Glob file matching
- Undo previous rename
- Customize by adding your own variables and filters
- Auto-indexing when renaming multiple files to the same name
- RegEx match/replace
- Exif data support

## Usage
```rename [options] file(s) new-file-name```

Or simply type `rename` for an interactive cli with live previews of rename operations.

*Note: Windows users (or anyone who wants to type one less letter) can use rname instead of rename since the rename command already exists in Windows*

The new file name does not need to contain a file extension. If you do not specifiy a file extension the original file extension will be preserved.

*Note: if you include periods in your new file name, you should include a file extension to prevent whatever is after the last period from becoming the new extension.*

## Options
 ```-h```, ```--help```: Show help    
 ```-i```, ```--info```: View online help    
 ```-w```, ```--wizard```: Run a wizard to guide you through renaming files    
 ```-u```, ```--undo```: Undo previous rename operation        
 ```-k```, ```--keep```: Keep both files when new file name already exists (append a number)    
 ```-f```, ```--force```: Force overwrite without prompt when new file name already exists    
 ```-s```, ```--sim```: Simulate rename and just print new file names    
 ```-n```, ```--noindex```: Do not append an index when renaming multiple files    
 ```-d```, ```--ignoredirectories```: Do not rename directories    
 ```-p```, ```--prompt```: Print all rename operations to be completed and confirm before proceeding    
 ```--notrim```: Do not trim whitespace at beginning or end of ouput file name    
 ```--nomove ```: Do not move files if their new file name points to a different directory  
 `--noext`: Do not automatically append a file extension if one isn't supplied (may be necessary if using a variable for an extension)  
 ```--createdirs```: Automatically create missing directories (cannot be used with `--nomove`)    
 ```--printdata```: Print the data available for a file

## Built-in Variables
<details><summary>The new file name can contain any number of built-in and custom variables that will be replaced with their corresponding value. Expand for more info.</summary>
<p>

 `{{i}}` Index: The index of the file when renaming multiple files to the same name. If you do no include `{{i}}` in your new file name, the index will be appended to the end. Use the `--noindex` option to prevent auto-indexing.

 `{{f}}` File name: The original name of the file.

 `{{p}}` Parent directory: The name of the parent directory.

 `{{isDirectory}}` Is directory: true/false. Useful for conditionally adding a file extension to files and not directories with `{% if isDirectory %}...`

 `{{os.x}}` Operating System: Information about the OS/user. Replace `x` with `homedir`, `hostname`, `platform`, or `user`

 `{{date.x}}` Dates: Insert a date. Replace `x` with `current` (the current date/time), `create` (the file's created date/time), `access` (the file's last accessed date/time) or `modify` (the file's last modified date/time)

 `{{g}}` GUID: A pseudo-random globally unique identifier.

 `{{exif.x}}` Exif: Photo Exif Information. Replace `x` with `iso`, `fnum`, `exposure`, `date`, `width`, or `height`

You can also add your own variables. See the [Customize](#customize) section for more info.

</p>
</details>

## Filters
<details><summary>You can modify variable values by applying filters. Multiple filters can be chained together. Nunjucks, the underlying engine, has a large number of <a href="https://mozilla.github.io/nunjucks/templating.html#builtin-filters">filters available</a> and Rename-CLI has a few of its own. Expand for more info.</summary>
<p>

String case manipulation
  - `lower` - all lowercase
  - `upper` - ALL UPPERCASE
  - `camel` - `something like-this → somethingLikeThis`
  - `pascal` - `something like-this → SomethingLikeThis`

-----

`replace('something', 'replacement')` - replace a character or string with something else.

```sh
rename "bills file.pdf" "{{ f | replace('bill', 'mary') | pascal }}"

bills file.pdf → MarysFile.pdf
```

-----

`date` - format a date to a specific format, the default is `YYYYMMDD` if no parameter is passed. To use your own format, simply pass the format as a string parameter to the date filter. Formatting options can be found [here](https://momentjs.com/docs/#/displaying/format/).

  ```sh
  rename *.txt "{{ d.now | date }}-{{f}}"

  a.txt → 20200502-a.txt
  b.txt → 20200502-b.txt
  c.txt → 20200502-c.txt

  rename *.txt "{{ d.now | date('MM-DD-YYYY') }}-{{f}}"

  a.txt → 05-02-2020-a.txt
  b.txt → 05-02-2020-b.txt
  c.txt → 05-02-2020-c.txt
  ```

  -----

`match(RegExp[, flags, group num/name])` - match substring(s) using a regular expression. The only required parameter is the regular expression (as a string), it also allows for an optional parameter flags (a string containing any or all of the flags: gimsuy, more info [here](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/RegExp#Parameters)), and an option parameter of the group number or name. *Named groups cannot be used with the global flag.*

```sh
rename *ExpenseReport* "archive/{{ f | match('^.+(?=Expense)') }}/ExpenseReport.docx" --createdirs

JanuaryExpenseReport.docx → archive/January/ExpenseReport.docx
MarchExpenseReport.docx → archive/March/ExpenseReport.docx
```

</p>
</details>

## Customize
<details><summary>Expand</summary>
<p>

You can expand and overwrite much of the default functionality by creating your own variables and filters.

### Variables

### Filters

</p>
</details>