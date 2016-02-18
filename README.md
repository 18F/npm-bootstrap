# npm-bootstrap

Bootstraps the current directory as an npm module, creating a package.json and optionally initializing a git repo.  Can also create a repo on GitHub (or use an existing one, so long as it hasn't been pushed to before) and push the first commit to it.  Adds LICENSE.md and README.md files to get you started.

## Installation

Might as well install this one globally if you want to use it.  Or install it locally if you'd like, but that seems silly.

```bash
npm install -g npm-bootstrap
```

## Usage

***NOTE:***  If you've enabled 2-factor authentication on your GitHub account, you will need to create a personal access token, available at [https://github.com/settings/tokens](https://github.com/settings/tokens).  The token for npm-bootstrap only needs the `public_repo` scope.

From the directory where you want to create your new module, run:

```bash
npm-bootstrap
```

Then follow the prompts!

### Public domain

This project is in the worldwide [public domain](LICENSE.md). As stated in [CONTRIBUTING](CONTRIBUTING.md):

> This project is in the public domain within the United States, and copyright and related rights in the work worldwide are waived through the [CC0 1.0 Universal public domain dedication](https://creativecommons.org/publicdomain/zero/1.0/).
>
> All contributions to this project will be released under the CC0 dedication. By submitting a pull request, you are agreeing to comply with this waiver of copyright interest.
