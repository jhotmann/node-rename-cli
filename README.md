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
 ```-h```, ```--help```: Show help    
 ```-i```, ```--info```: View online help    
 ```-w```, ```--wizard```: Run a wizard to guide you through renaming files    
 ```-u```, ```--undo```: Undo previous rename operation    
 ```-r "RegEx"```: See [RegEx](#regex) section for more information    
 ```-k```, ```--keep```: Keep both files when output file name already exists (append a number)    
 ```-f```, ```--force```: Force overwrite without prompt when output file name already exists    
 ```-s```, ```--sim```: Simulate rename and just print new file names    
 ```-n```, ```--noindex```: Do not append an index when renaming multiple files. Use with caution.    
 ```-d```, ```--ignoredirectories```: Do not rename directories    
 ```-p```, ```--prompt```: Print all rename operations to be completed and confirm before proceeding    
 ```-v```, ```--verbose```: Print all rename operations to be completed and confirm before proceeding with bonus variable logging    
 ```--notrim```: Do not trim whitespace at beginning or end of ouput file name    
 ```--nomove ```: Do not move files if their new file name points to a different directory  
 ```--createdirs```: Automatically create missing directories (cannot be used with `--nomove`)    

### Variables
The new file name can contain any number of variables that will be replaced with their value. Some variables can take parameters and will be indicated in their description. To pass a parameter to a variable, just use the variable name followed by a pipe and the parameter. **The output file name must be surrounded by quotes when using parameters.** See the first example below for how to use parameters.    

 `{{i}}` Index: The index of the file when renaming multiple files. Parameters: starting index, default is `1`: `{{i|starting index}}`

 `{{f}}` File name: The original name of the file. Parameters: Param 1: `upper`, `lower`, `camel`, `pascal`, blank for unmodified, or `replace`. If replace, then Param2: search string and Param3: replace string: `{{f|modifier}}` or `{{f|replace|search|replacement}}`

 `{{p}}` Parent directory: The name of the parent directory. Parameters: Param 1: `upper`, `lower`, `camel`, `pascal`, blank for unmodified, or `replace`. If replace, then Param2: search string and Param3: replace string: `{{p|modifier}}` or `{{p|replace|search|replacement}}`

 `{{replace}}` Replace: Replace one string in the original file name with another. Parameters: The string to start with, a string to search for, and a string to replace it with: `{{replace|SomeStringOrVariable|search|replacement}}`

 `{{r}}` RegEx: The specified match of the RegEx pattern(s) specified in `-r`. Parameters: the number of the regex match, default is `0`: `{{r|match number}}`

 `{{ra}}` RegEx All: All matches of the RegEx pattern specified in `-r`. Parameters: separator character(s), default is none: `{{ra|separator}}`

 `{{rn}}` RegEx Not: Everything but the matches of the RegEx pattern specified in `-r`. Parameters: replacement character(s), default is none: `{{rn|separator}}`

 `{{regex}}` RegEx v2: The match(es) of the RegEx pattern specified. Parameters: the regular expression, optional flags, and the number of the regex match or the joiner for all matches: `{{regex||regular expression||flags||number or joiner}}`

 `{{date}}` Dates: Insert a date in a specific format. Parameters: the first parameter should be one of the following: `c[urrent]`, `cr[eate]`, `m[odify]`, or `a[ccess]`, and the second parameter is the date format which defaults to `yyyymmdd`: `{{date|type|format}}`

 `{{g}}` GUID: A globally unique identifier. Parameters: pattern using x's which will be replaced as random 16bit characters and y's which will be replaced with a, b, 8, or 9. Default is `xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`: `{{g}}`

 `{{exif}}` Exif Information: Photo Exif Information. Parameters: the first parameter should be one of the following: i[so], f[num], e[xposure], d[ate], h[eight], or w[idth]. If the first parameter is d[ate], then also include another parameter for the date format: `{{exif|property|date format}}`    

### RegEx
As of version `6.0.0` a new way of using regular expressions has been added. You can now simply add a `{{regex||regular expression||flags||number or joiner}}` replacement variable in the output file name to include the result(s) of the specified regular expression on the original file name. No need to use the `-r` option and no need for forward slashes in your regular expression.

*Old method*: When you specify a RegEx pattern with the `-r` option, the regular expression will be run against the original file name and the first match will be used to replace `{{r}}` in the output file name. You can also use `{{ra}}` in the output file name to keep all matches separated by a string you supply as an argument (or no argument to just append all matches together). If the regular expression fails to match, an empty string will be returned. **DO NOT** include the forward slashes in your RegEx pattern.

 **Regex Replace:**    
 You can write RegEx to replace characters you don't want. Let's say you want to replace all spaces in a file name with a `-`. To do this, use an output file name like this: `{{regex||[^ ]+||g||-}}`. The regular expression `[^ ]+` will look for multiple non-space characters in a row and join them with a `-`.  With the new `replace` option for the `{{f}}` variable you can simplify your output file name by using use the following: `{{f|replace| |-}}`.  In both of these examples, all spaces will be replaced by dashes, so if you had a file named ```My Text File.txt``` it would become ```My-Text-File.txt```.

 **Groups:**    
 You can write RegEx to capture one or more named groups and then use those groups in your output file name. The groups should be written like: ```(?<GroupName>regular expression here)```. If the RegEx groups do not return a match, the replacement variables in the output file name will be blank, so be sure to test with the -s option. See the third example below for how to use RegEx groups.

## Examples

1. Prepend date to file name. Date formatting options can be found [here](https://github.com/felixge/node-dateformat#mask-options).

    ```sh
    rename *.log "{{date|current|yyyymmdd}}{{f}}"
      node.log → 20170303node.log
      system.log → 20170303system.log
    ```
    ##### *Note: the default parameters for the date variable are current and yyyymmdd so in the above example you could just write ```rename *.log {{date}}{{f}}``` to achieve the same result. You can see default parameters for variables by typing ```rename -h```.*

1. Rename all files the same and an index number will be appended. The index will be prepended with the correct number of zeroes to keep file order the same. For example, if you are renaming 150 files, the first index will be 001. You can change the starting index by adding the index variable with a parameter ```{{i|42}}``` If you don't want to include indexes use the ```-n``` option and you will be prompted for any file conflicts. Each file extension in a rename operation will have its own independent index.

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

    New Method:

    ```sh
    rename My.File.With.Periods.2016.more.info.txt "{{regex||\w+(?=.+\d{4})|\d{4}||g|| }}"

      My.File.With.Periods.2016.more.info.txt → My File With Periods 2016.txt
    ```

    Old Method:

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
    rename *.jpg "{{exif|d}}-NewYorkCity{{i}}-ISO{{exif|iso}}-f{{exif|f}}-{{exif|e}}s"
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
