# Rename-CLI
A tool for renaming files quickly, especially multiple files at once.

## Features
- Glob file matching
- Undo previous rename
- Variable replacement in output file name
- Ability to add your own variables
- Auto-indexing when renaming multiple files
- RegEx support for using part(s) of original file name
- Exif data support

## Usage
```rename [options] files new-file-name```

The new file name does not need to contain a file extension. If you do not specifiy a file extension the original file extension will be preserved. *Note: if you include periods in your new file name, you should include a file extension to prevent whatever is after the last period from becoming the new extension.*

### Options
 ```-i```, ```--info```: View online help 
 ```-v```, ```--variables```: Display available variables    
 ```-u```, ```--undo```: Undo previous rename operation    
 ```-r "RegEx"```: See [RegEx](#regex) section for more information    
 ```-f```, ```--force```: Force overwrite without prompt when output file name already exists    
 ```-s```, ```--sim```: Simulate rename and just print new file names    
 ```-n```, ```--noindex```: Do not append an index when renaming multiple files. Use with caution.    
 ```-h```, ```--help```: Show help

### Variables
The new file name can contain any number of variables that will be replaced with their value. Some variables can take parameters and will be indicated in their description. To pass a parameter to a variable, just use the variable name followed by a pipe and the parameter. The output file name must be surrounded by quotes when using parameters. See the first example below for how to use parameters.    

 ```{{i}}``` Index: The index of the file when renaming multiple files. Parameters: starting index, default is 1.    
 ```{{f}}``` File name: The original name of the file. Parameters: upper, lower, camel, pascal, or none for unmodified.    
 ```{{r}}``` RegEx: The match of the RegEx pattern specified in -r "...".    
 ```{{p}}``` Parent directory: The name of the parent directory. Parameters: upper, lower, camel, pascal, or none for unmodified.    
 ```{{d}}``` Date: The current date/time. Parameters: date format, default is yyyymmdd.    
 ```{{cd}}``` Create date: The date/time the file was created. Parameters: date format, default is yyyymmdd.    
 ```{{md}}``` Modified date: The date/time the file was modified. Parameters: date format, default is yyyymmdd.    
 ```{{ad}}``` Accessed date: The date/time the file was accessed. Parameters: date format, default is yyyymmdd.    
 ```{{g}}``` GUID: A globally unique identifier.    
 ```{{eiso}}``` Exif ISO: Photo ISO value.    
 ```{{efnum}}``` Exif FNumber: Photo FNumber value.    
 ```{{eex}}``` Exif Exposure Time: Photo exposure time value.    
 ```{{ed}}``` Exif Date: The date/time photo was taken. Parameters: date format, default is yyyymmdd.    

### RegEx
When you specify a RegEx pattern with the -r option, the regular expression will be run against the original file name and the first match will be used to replace {{r}} in the output file name. If the regular expression fails to match, and empty string will be returned. **DO NOT** include the forward slashes in your RegEx pattern.

 Groups:    
 You can write RegEx to capture one or more named groups and then use those groups in your output file name. The groups should be written like: ```(?<GroupName>regular expression here)```. If the RegEx groups do not return a match, the replacement variables in the output file name will be blank, so be sure to test with the -s option. See the third example below for how to use RegEx groups.

### Examples

Prepend date to file name. Date formatting options can be found [here](https://github.com/felixge/node-dateformat#mask-options).

```sh
rename *.log "{{d|yyyymmdd}}{{f}}"
  node.log → 20170303node.log
  system.log → 20170303system.log
```

Rename all files the same and an index will be appended. The index will include the correct number of zeroes to keep file order the same.

```sh
rename *.log test
   node.log → test1.log
   system.log → test2.log
```

Use RegEx groups to reuse sections of the original file name.

```sh
rename -r "- (?<month>[A-Za-z]+) (?<year>\d{4})" --noindex ExpenseReport*.pdf "{{year}} - {{month}} Expense Report"
   ExpenseReport - August 2016.pdf → 2016 - August Expense Report.pdf
   ExpenseReport - March 2015.pdf → 2015 - March Expense Report.pdf
   ExpenseReport - October 2015.pdf → 2015 - October Expense Report.pdf
```

Extract Exif data from jpg images.

```sh
rename *.jpg "{{ey}}{{em}}{{ed}}-NewYorkCity{{i}}-ISO{{eiso}}-f{{efnum}}-{{eex}}s"
   DSC_5621.jpg → 20150927-NewYorkCity1-ISO250-f5.6-10s.jpg
   DSC_5633.jpg → 20150928-NewYorkCity2-ISO125-f7.1-1/400s.jpg
   DSC_5889.jpg → 20150930-NewYorkCity3-ISO125-f4.5-1/200s.jpg
```

## Installation
1. Install NodeJS if you haven't already https://nodejs.org
1. Type `npm install -g rename-cli` into your terminal or command window

## Adding custom replacement variables
Whenever you run rename for the first time a file ```~/.rename/replacements.js``` or ```C:\Users\[username]\.rename\replacements.js``` is created. You can edit this file and add your own replacement variables **and override** the default replacements if desired. The user replacements.js file contains a decent amount of documentation in it and you can check out the default [replacements.js](lib/replacements.js) file for more examples. If you come up with some handy replacements, feel free to submit them to be included in the defaults with a pull request or submit it as an issue.

## Libraries Used
- yargs https://github.com/yargs/yargs
- glob https://github.com/isaacs/node-glob
- fs-extra https://github.com/jprichardson/node-fs-extra
- file-exists https://github.com/scottcorgan/file-exists
- prompt-sync https://github.com/0x00A/prompt-sync
- lodash https://lodash.com/
- node-dateformat https://github.com/felixge/node-dateformat
- named-js-regexp https://github.com/edvinv/named-js-regexp
- num2fraction https://github.com/yisibl/num2fraction
- jpeg-exif https://github.com/zhso/jpeg-exif
- opn https://github.com/sindresorhus/opn
