# Rename-CLI [Beta]
A tool for renaming files quickly, especially multiple files at once.

Currently in beta as it has only been tested on MacOS but should also function great on Linux. I added [glob](https://github.com/isaacs/node-glob) file search ability so Windows should work with wildcards but it hasn't been tested (use **rname** command instead of rename since Windows already has a rename command). I will also be adding more variable replacements over time or you can submit some via pull request.  See replacements.js for example.

```
Usage: rename [options] files new-file-name
 If you rename multiple files at once, an index will be appended
 to the end of the file unless the resulting file name will be
 unique. Like when using {{f}} or {{g}}.
 If you do not specify a file extension in the new file name, the
 original file extension will be used.

Options:

 -h, --help    Display this usage info
 --f           Force overwrite when output file name already exists
 --s           Simulate rename and just print new file names

Available Variables:

 {{i}}         Index: The index of the file when renaming multiple files
 {{f}}         File name: The original name of the file
 {{fl}}        File name lower: The original name of the file in lower case
 {{fu}}        File name upper: The original name of the file in upper case
 {{fc}}        File name camel case: The original name of the file in camel case
 {{fp}}        File name pascal case: The original name of the file in pascal case
 {{p}}         Parent directory: The name of the parent directory
 {{y}}         Year: The current year
 {{m}}         Month: The current month
 {{d}}         Day: The current day
 {{g}}         GUID: A globally unique identifier

Examples:

 rename *.log {{y}}{{m}}{{d}}{{f}}
   node.log → 20170303node.log
   system.log → 20170303system.log

 rename *.log test
   node.log → test1.log
   system.log → test2.log

   note: index will prepend with zeros to keep file order the same
   when there are more than 9 files renamed.
```

## Installation
1. Install NodeJS if you haven't already https://nodejs.org
1. Type `npm install -g rename-cli` into your terminal or command window

## Libraries Used
- Minimist https://github.com/substack/minimist
- glob https://github.com/isaacs/node-glob
- file-exists https://github.com/scottcorgan/file-exists
- prompt-sync https://github.com/0x00A/prompt-sync
- lodash https://lodash.com/
