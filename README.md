# Rename-CLI
A cross-platform tool for renaming files quickly, especially multiple files at once.

![gif preview](images/rename.gif)

## Features
- Glob file matching
- Undo previous rename
- Variable replacement in output file name
- Ability to add your own variables
- Auto-indexing when renaming multiple files
- RegEx support for using part(s) of original file name
- RegEx replace part(s) of the original file name
- Exif data support

## Usage
```rename [options] file(s) new-file-name```

*Note: Windows users (or anyone who wants to type one less letter) can use rname instead of rename since the rename command already exists in Windows*

The new file name does not need to contain a file extension. If you do not specifiy a file extension the original file extension will be preserved. *Note: if you include periods in your new file name, you should include a file extension to prevent whatever is after the last period from becoming the new extension.*

### Options
 ```-i```, ```--info```: View online help    
 ```-w```, ```--wizard```: Run a wizard to guide you through renaming files    
 ```-u```, ```--undo```: Undo previous rename operation    
 ```-r "RegEx"```: See [RegEx](#regex) section for more information    
 ```-k```, ```--keep```: Keep both files when output file name already exists (append a number)    
 ```-f```, ```--force```: Force overwrite without prompt when output file name already exists    
 ```-s```, ```--sim```: Simulate rename and just print new file names    
 ```-n```, ```--noindex```: Do not append an index when renaming multiple files. Use with caution.    
 ```-v```, ```--verbose```: Print all rename operations to be completed and confirm before proceeding
 ```--notrim```: Do not trim whitespace at beginning or end of ouput file name    
 ```-h```, ```--help```: Show help

### Variables
The new file name can contain any number of variables that will be replaced with their value. Some variables can take parameters and will be indicated in their description. To pass a parameter to a variable, just use the variable name followed by a pipe and the parameter. **The output file name must be surrounded by quotes when using parameters.** See the first example below for how to use parameters.    

 ```{{i}}``` Index: The index of the file when renaming multiple files. Parameters: starting index, default is 1.    
 ```{{f}}``` File name: The original name of the file. Parameters: upper, lower, camel, pascal, or none for unmodified.    
 ```{{r}}``` RegEx: The match of the RegEx pattern(s) specified in -r "...". Parameters: the index of the regex match, default is 0.    
 ```{{ra}}``` RegEx All: All matches of the RegEx pattern specified in -r "...". Parameters: separator character(s), default is none.  
 ```{{rn}}``` RegEx Not: Everything except for the matches of the RegEx pattern specified in -r "...". Parameters: replacement character(s), default is none    
 ```{{p}}``` Parent directory: The name of the parent directory. Parameters: upper, lower, camel, pascal, or none for unmodified.    
 ```{{d}}``` Date: The current date/time. Parameters: date format, default is yyyymmdd.    
 ```{{cd}}``` Create date: The date/time the file was created. Parameters: date format, default is yyyymmdd.    
 ```{{md}}``` Modified date: The date/time the file was modified. Parameters: date format, default is yyyymmdd.    
 ```{{ad}}``` Accessed date: The date/time the file was accessed. Parameters: date format, default is yyyymmdd.    
 ```{{g}}``` GUID: A globally unique identifier. Parameters: pattern using x's which will be replaced as random 16bit characters and y's which will be replaced with a, b, 8, or 9. Default is xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx    
 ```{{eiso}}``` Exif ISO: Photo ISO value.    
 ```{{efnum}}``` Exif FNumber: Photo FNumber value.    
 ```{{eex}}``` Exif Exposure Time: Photo exposure time value.    
 ```{{ed}}``` Exif Date: The date/time photo was taken. Parameters: date format, default is yyyymmdd.    
 ```{{eh}}``` Exif Height: The height in pixels of the photo
 ```{{ew}}``` Exif Width: The width in pixels of the photo

### RegEx
When you specify a RegEx pattern with the -r option, the regular expression will be run against the original file name and the first match will be used to replace {{r}} in the output file name. You can also use {{ra}} in the output file name to keep all matches separated by a string you supply as an argument (or no argument to just append all matches together). If the regular expression fails to match, an empty string will be returned. **DO NOT** include the forward slashes in your RegEx pattern.

 Regex Replace:    
 You can write RegEx to replace characters you don't want. To do this, use a RegEx pattern to match things you want to remove like ```\s``` and for your output file name use ```"{{rn|-}}``` with the characters you want to use as replacements after the pipe.  In this example, all spaces will be replaced by dashes, so if you had a file named ```My Text File.txt``` it would become ```My-Text-File.txt```. Or if you want to replace a specific word you could do something like the following: ```-r "Text"``` with the output file name ```"{{rn|Log}}"``` and your new file name would be ```My Log File.txt```. If you want to easily replace all characters that aren't a letter, number, or underscore use ```\W``` (yes, that's a capital W) as your RegEx pattern.

 Groups:    
 You can write RegEx to capture one or more named groups and then use those groups in your output file name. The groups should be written like: ```(?<GroupName>regular expression here)```. If the RegEx groups do not return a match, the replacement variables in the output file name will be blank, so be sure to test with the -s option. See the third example below for how to use RegEx groups.

## Examples

1. Prepend date to file name. Date formatting options can be found [here](https://github.com/felixge/node-dateformat#mask-options).

    ```sh
    rename *.log "{{d|yyyymmdd}}{{f}}"
      node.log → 20170303node.log
      system.log → 20170303system.log
    ```
    ##### *Note: the default format for the date variable is yyyymmdd so in the above example you could just write ```rename *.log {{d}}{{f}}``` to achieve the same result. You can see default parameters for variables by typing ```rename -h```.*

1. Rename all files the same and an index number will be appended. The index will be prepended with the correct number of zeroes to keep file order the same. For example, if you are renaming 150 files, the first index will be 001. You can change the starting index by adding the index variable with a parameter ```{{i|42}}``` If you don't want to include indexes use the ```-n``` option. You will be prompted for any file conflicts. Each file extension in a rename operation will have its own independent index.

    ```sh
    rename *.log test
      node.log → test1.log
      system.log → test2.log
    ```

1. Use RegEx groups to reuse sections of the original file name.

    ```sh
    rename -r "- (?<month>[A-Za-z]+) (?<year>\d{4})" --noindex ExpenseReport*.pdf "{{year}} - {{month}} Expense Report"
      ExpenseReport - August 2016.pdf → 2016 - August Expense Report.pdf
      ExpenseReport - March 2015.pdf → 2015 - March Expense Report.pdf
      ExpenseReport - October 2015.pdf → 2015 - October Expense Report.pdf
    ```

1. Use all RegEx matches in the output file name separated by a space. RegEx explaination: ```\w+``` captures a string of 1 or more word characters (A-Z, a-z, and _), ```(?=.+\d{4})``` is a forward lookahead for a number of 4 digits (this means it will only find words before the number), and then ```|``` which means 'or', and finally ```\d{4}``` a number of 4 digits.

    ```sh
    rename -r "\w+(?=.+\d{4})|\d{4}" My.File.With.Periods.2016.more.info.txt "{{ra| }}"
      My.File.With.Periods.2016.more.info.txt → My File With Periods 2016.txt
    ```

1. Use multiple RegEx options with `{{rn}}` to filter out different parts of the input file name in order. RegEx and parameter explaination: first .2016. and all following characters are replaced due to the first RegEx rule `-r "\.\d{4}\..+"`, then we match just the year with the second RegEx rule for use later with `{{r|1}}`, and then all periods are replaced due to the third RegEx rule. Finally we add back the year inside parenthesis. Since JavaScript uses 0 as the first index of an array, 1 finds the second regex match which is just the year as specified by ` -r "\d{4}"`.

    ```sh
    rename  -r "\.\d{4}\..+" -r "\d{4}" -r "\." My.File.With.Periods.2016.more.info.txt "{{rn| }}({{r|1}})"
      My.File.With.Periods.2016.more.info.txt → My File With Periods (2016).txt
    ```

1. Extract Exif data from jpg images.

    ```sh
    rename *.jpg "{{ed}}-NewYorkCity{{i}}-ISO{{eiso}}-f{{efnum}}-{{eex}}s"
      DSC_5621.jpg → 20150927-NewYorkCity1-ISO250-f5.6-10s.jpg
      DSC_5633.jpg → 20150928-NewYorkCity2-ISO125-f7.1-1/400s.jpg
      DSC_5889.jpg → 20150930-NewYorkCity3-ISO125-f4.5-1/200s.jpg
    ```

## Installation
1. Install NodeJS if you haven't already https://nodejs.org
1. Type `npm install -g rename-cli` into your terminal or command window.

## Adding custom replacement variables
Whenever you run rename for the first time a file ```~/.rename/replacements.js``` or ```C:\Users\[username]\.rename\replacements.js``` is created. You can edit this file and add your own replacement variables **and override** the default replacements if desired. The user replacements.js file contains a decent amount of documentation in it and you can check out the default [replacements.js](lib/replacements.js) file for more examples. If you come up with some handy replacements, feel free to submit them to be included in the defaults with a pull request or submit it as an issue.

## Libraries Used
- yargs https://github.com/yargs/yargs
- blessed https://github.com/chjj/blessed
- globby https://github.com/sindresorhus/globby
- fs-extra https://github.com/jprichardson/node-fs-extra
- prompt-sync https://github.com/0x00A/prompt-sync
- node-dateformat https://github.com/felixge/node-dateformat
- named-js-regexp https://github.com/edvinv/named-js-regexp
- num2fraction https://github.com/yisibl/num2fraction
- jpeg-exif https://github.com/zhso/jpeg-exif
- opn https://github.com/sindresorhus/opn
- path-exists https://github.com/sindresorhus/path-exists
- chalk https://github.com/chalk/chalk
- cli-clear https://github.com/stevenvachon/cli-clear
- inquirer https://github.com/SBoudrias/Inquirer.js
- clipboardy https://github.com/sindresorhus/clipboardy
- remark https://github.com/wooorm/remark
