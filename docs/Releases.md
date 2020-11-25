# Release Guide
When ready to release an update, follow these steps to ensure all installation methods work.

1. Ensure the version number is updated in [package.json](../package.json)
1. Draft a release on the GitHub [releases](https://github.com/jhotmann/node-rename-cli/releases) page with information about the update. Make sure to link to any fixed bugs.
1. Download the binaries from the latest [automated build](https://github.com/jhotmann/node-rename-cli/actions) and attach to the release.
1. Publish the release to NPM `npm publish[ --tag beta]`, ran from the project's root directory.
1. Update the [Homebrew formula](https://github.com/jhotmann/homebrew-rename-cli/blob/master/Formula/rename-cli.rb) with the latest version number and sha256 of the gzip `shasum -a 256 rename-cli-X.X.X.tgz`.
1. Download and publish the updated nupkg to Chocolatey `choco push .\rename-cli.X.X.X.nupkg --source https://push.chocolatey.org`.