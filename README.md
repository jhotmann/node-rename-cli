# Rename-CLI [Beta]
A tool for renaming files quickly, especially multiple files at once.

Currently in beta as it has only been tested on MacOS and should function great on Linux but Windows is currently not working due to how the command prompt handles wildcards. I will be fixing this at some point (probably using glob), but it's not my highest priority. I will also be adding more variable replacements over time or you can submit some via pull request.  See replacements.js for example.

```
Usage: rename [options] files new-file-name
 If you rename multiple files at once, an index will be appended
 to the end of the file unless otherwise specified with {{i}}, or
 the original file name is used via {{f}}.
 If you do not specify a file extension in the new file name, the
 original file extension will be used.

Options:

 -h, --help    Display this usage info
 --f           Force overwrite when output file name already exists
 --s           Simulate rename and just print new file names

Available Variables:

 {{i}}    Index: The index of the file when renaming multiple files
 {{f}}    File name: The original name of the file
 {{p}}    Parent directory: The name of the parent directory
 {{y}}    Year: The current year
 {{m}}    Month: The current month
 {{d}}    Day: The current day

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
- file-exists https://github.com/scottcorgan/file-exists
- prompt-sync https://github.com/0x00A/prompt-sync
- lodash https://lodash.com/
