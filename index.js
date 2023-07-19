#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import url from 'url';
import { exec } from 'child_process';
import dotenv from 'dotenv';
import clear from 'clear';
import figlet from 'figlet';
import inquirer from 'inquirer';

import log from './utils/log.js';
import Git from './utils/git.js';
import { getArgs } from './utils/args.js';

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const args = getArgs();

const envPath = path.resolve(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  log.error(`${envPath} not found`);
  process.exit();
}

dotenv.config({
  path: path.resolve(__dirname, '.env'),
});

clear();

log.yellow(figlet.textSync('git-init', { horizontalLayout: 'full' }));
console.log();

if (fs.existsSync('.git')) {
  log.warning(`Already a Git repository!`);
} else {
  await Git.init();
}

const packageJsonPath = path.resolve('package.json');
if (fs.existsSync(packageJsonPath)) {
  log.warning(`${packageJsonPath} already exists`);
} else {
  await new Promise((resolve, reject) =>
    exec('npm init -y', (error, stdout, stderr) => {
      if (error) {
        log.error(error.message);
        reject(false);
      }
      if (stderr) {
        log.error(stderr);
        reject(false);
      }
      log.done(stdout.split('\n')[0]);
      resolve(true);
    }),
  );
}

const gitIgnorePath = path.resolve('.gitignore');
if (fs.existsSync(gitIgnorePath)) {
  log.warning(`${gitIgnorePath} already exists`);
} else {
  await Git.addGitIgnore(gitIgnorePath);
  log.done(`${gitIgnorePath} created`);
}

const privateKeyName = process.env.PRIVATE_KEY;
if (!privateKeyName) {
  log.error(`PRIVATE_KEY not found in .env file`);
  process.exit();
}

const keyPath = path.resolve(__dirname, process.env.PRIVATE_KEY);
if (!fs.existsSync(keyPath)) {
  log.error(`${keyPath} not found`);
  process.exit();
}

const privateKey = fs.readFileSync(keyPath, 'utf8');
if (!privateKey) {
  log.error(`${keyPath} is empty`);
  process.exit();
}

const git = new Git(privateKey);

const repoNameFromArgs = args['repo-name'];
let repoName = repoNameFromArgs || path.basename(process.cwd());

do {
  const result = await git.getGitRepoList();
  const isNameExist = result.data.map(repo => repo.name).includes(repoName);

  if (isNameExist) {
    log.info(`repository "${repoName}" already exists`);

    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'What do you want to do?',
        choices: [
          { name: 'Create repository with new name', value: 'new' },
          { name: 'Add "remote" with existing repository', value: 'remote' },
          { name: 'Exit', value: 'exit' },
        ],
      },
    ]);

    if (action === 'new') {
      const { name } = await inquirer.prompt([
        {
          type: 'input',
          name: 'name',
          message: 'Enter new repository name:',
        },
      ]);
      repoName = name;
      continue;
    }

    if (action === 'remote') {
      break;
    }

    if (action === 'exit') {
      log.done(`Bye!`);
      process.exit();
    }
  } else {
    // Create repo
    await git.createRepo(repoName);
    log.done(`Repository "${repoName}" created`);
    break;
  }

  break;
} while (true);

const result = await git.getGitRepoList();

const newRepo = result.data.find(repo => repo.name === repoName);

if (!newRepo) {
  log.error(`repository "${repoName}" not found`);
  process.exit();
}

// Add remote
const sshUrl = newRepo.ssh_url;
if (sshUrl) {
  await git.addRemote(sshUrl);
} else {
  log.error(`ssh_url not found`);
}

// Initial commit
if (args['no-initial-commit']) {
  log.info(`initial commit skipped`);
} else {
  if (!(await git.createInitialCommit())) process.exit();
}

log.done(`All done!`);
