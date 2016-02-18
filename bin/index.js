#! /usr/bin/env node
"use strict";

var Promise = require("promise");
var promisify = require("promisify-node");
var exec = promisify(require("child_process").exec);
var path = require("path");
var fs = require("fs-extra");
var inq = require("inquirer");
var GitHub = require("github");
var pace = require("pace");

var moduleName = path.basename(process.cwd());

inq.prompt([{
	type: "input",
	name: "name",
	message: "Package name:",
	default: moduleName,
	validate: function validate(v) {
		moduleName = v;
		return (/^[a-z0-9][a-z0-9-_.]{1,213}$/.test(v)
		);
	}
}, {
	type: "input",
	name: "version",
	message: "Version:",
	default: "1.0.0",
	validate: function validate(input) {
		return (/^([0-9]+\.?){1,3}$/.test(input)
		);
	},
	filter: function filter(input) {
		var filtered = input;

		if (filtered.substr(-1, 1) === ".") {
			filtered = filtered.substr(0, filtered.length - 1);
		}
		filtered = filtered.split(".");
		while (filtered.length < 3) {
			filtered.push("0");
		}
		filtered = filtered.map(function (v) {
			return v === "" ? "0" : v;
		});
		filtered = filtered.join(".");

		return filtered;
	}
}, {
	type: "input",
	name: "description",
	message: "Description:"
}, {
	type: "input",
	name: "authorName",
	message: "Author's name:"
}, {
	type: "input",
	name: "authorEmail",
	message: "Author's email:"
}, {
	type: "input",
	name: "entry",
	message: "Module entry point:",
	default: "main.js"
}, {
	type: "input",
	name: "keywords",
	message: "Keywords (comma-separated):",
	filter: function filter(v) {
		return v.split(",").map(function (k) {
			return k.trim();
		});
	}
}, {
	type: "confirm",
	name: "useGit",
	message: "Create a git repo?",
	default: true
}, {
	type: "confirm",
	name: "useGithub",
	message: "Use GitHub?",
	default: true,
	when: function when(a) {
		return a.useGit;
	}
}, {
	type: "input",
	name: "repoName",
	message: "Repo name:",
	default: moduleName,
	when: function when(a) {
		return a.useGithub;
	}
}, {
	type: "input",
	name: "ghUsername",
	message: "GitHub username:",
	when: function when(a) {
		return a.useGithub;
	}
}, {
	type: "password",
	name: "ghPassword",
	message: "GitHub password:",
	when: function when(a) {
		return a.useGithub;
	}
}], function (answers) {
	var steps = 1;

	if (answers.useGit) {
		steps = 5;
		if (answers.useGithub) {
			steps = 8;
		}
	}
	var progress = pace(steps);

	var author = answers.authorName;

	if (answers.authorEmail) {
		author += " <" + answers.authorEmail + ">";
	}

	var pkgJson = {
		name: answers.name,
		version: answers.version,
		description: answers.description,
		main: answers.entry,
		keywords: answers.keywords,
		author: author,
		license: "CC0-1.0"
	};

	new Promise(function (resolve) {
		if (answers.useGit) {
			fs.writeFileSync(".gitignore", "node_modules");
			progress.op();
			exec("git init").then(function () {
				progress.op();
				if (answers.useGithub) {
					return true;
				}
				throw new Error();
			}).then(function () {
				var github = new GitHub({ version: "3.0.0" });

				github.authenticate({
					type: "basic",
					username: answers.ghUsername,
					password: answers.ghPassword
				});

				github.repos.get({ user: answers.ghUsername, repo: answers.repoName }, function (_, repo) {
					if (!repo) {
						github.repos.create({
							name: answers.repoName,
							description: answers.description
						}, function (__, createdRepo) {
							progress.op();
							if (createdRepo) {
								pkgJson.repository = {
									type: "git",
									url: answers.ghUsername + "/" + answers.repoName
								};
							}
							resolve(createdRepo.ssh_url);
						});
					} else if (repo.created_at === repo.pushed_at) {
						progress.op();
						resolve(repo.ssh_url);
					} else {
						// In this case, the Github repo already exists
						// and has been pushed to.
						progress.op();
						resolve();
					}
				});
			}).catch(function () {
				resolve();
			});
		} else {
			resolve();
		}
	}).then(function (gitRepoUrl) {
		fs.writeFileSync("package.json", JSON.stringify(pkgJson, null, "  "));
		fs.copySync(path.join(__dirname, "../LICENSE.md"), "LICENSE.md");
		fs.copySync(path.join(__dirname, "../CONTRIBUTING.md"), "CONTRIBUTING.md");
		fs.writeFileSync("README.md", "# " + answers.name + "\n\n### Public domain\n\nThis project is in the worldwide [public domain](LICENSE.md). As stated in [CONTRIBUTING](CONTRIBUTING.md):\n\n> This project is in the public domain within the United States, and copyright and related rights in the work worldwide are waived through the [CC0 1.0 Universal public domain dedication](https://creativecommons.org/publicdomain/zero/1.0/).\n>\n> All contributions to this project will be released under the CC0 dedication. By submitting a pull request, you are agreeing to comply with this waiver of copyright interest.\n");
		progress.op();

		if (answers.useGit) {
			exec("git add .").then(function () {
				progress.op();
				return exec("git commit -m \"Initial commit\"");
			}).then(function () {
				progress.op();
				if (gitRepoUrl) {
					return exec("git remote add origin " + gitRepoUrl);
				}
				throw new Error();
			}).then(function () {
				progress.op();
				return exec("git push -u origin master");
			}).then(function () {
				progress.op();
			});
		}
	});
});