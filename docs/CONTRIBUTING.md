# Contributing

Thanks for taking the time to help make rename-cli even better! Please follow the guidelines below if you wish to submit issues or add functionality to rename-cli.

## Setting up your dev environment

1. Install Node 12 or later https://nodejs.org/en/download/
1. Install git https://git-scm.com/downloads
1. Install VSCode and the ESLint extension (optional, but recommended)
    - https://code.visualstudio.com/Download
    - https://vscodium.com/ (fully FOSS version)
1. Clone your fork of the rename-cli repo to your local machine
1. `cd` into the `node-rename-cli` directory and run `npm install`

## Adding tests

Going forward, when adding functionality or making fixes, unit tests must be added if they don't already exist for the functionality. These tests exist in `tests/test.js`.

The `test.js` file will create a `test` directory with a bunch of files in it for testing and you can add code to create more test files if you need. Then add a new test to the end of the existing tests using the `runTest()` helper method.

That method takes the following arguments `runTest('your command here', 'Short description of what is being tested', [String or Array of Strings of source file name(s)], [String or Array of Strings of new file name(s)]);`

After you have added your test(s) you can then run `npm test` from the root directory of the project. If all the tests are passing you can then commit, push, and create a pull request.