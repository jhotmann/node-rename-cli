#!/usr/bin/env node

const fs = require('fs-extra');
const nunjucks = require('nunjucks');
const packageJson = require('../package.json');

let results = nunjucks.render('chocolatey/rename-cli.nuspec.html', packageJson);
fs.writeFileSync('chocolatey/rename-cli/rename-cli.nuspec', results, 'utf8');
fs.copyFileSync('bin/rename-cli-win.exe', 'chocolatey/rename-cli/tools/rname.exe');
fs.copyFileSync('license', 'chocolatey/rename-cli/tools/LICENSE.txt');