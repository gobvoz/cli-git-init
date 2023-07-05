#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import url from 'url';
import { exec } from 'child_process';
import dotenv from 'dotenv';
import chalk from 'chalk';
import clear from 'clear';
import figlet from 'figlet';
import { Octokit } from 'octokit';

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const log = {
  _log: (message, prefix) => console.log(`%s ${message}`, prefix),
  done: function (message) {
    this._log(message, '\x1b[32m\x1b[01mDONE \x1b[0m');
  },
  error: function (message) {
    this._log(message, '\x1b[31m\x1b[01mERROR \x1b[0m');
  },
  warning: function (message) {
    this._log(message, '\x1b[33m\x1b[01mWARNING \x1b[0m');
  },
  yellow: function (message) {
    this._log(`\x1b[33m${message}\x1b[0m`);
  },
};

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
  await new Promise((resolve, reject) =>
    exec('git init', (error, stdout, stderr) => {
      if (error) {
        console.log(`%s ${error.message}`, chalk.red.bold('ERROR'));
        reject(false);
      }
      if (stderr) {
        console.log(`%s ${stderr}`, chalk.red.bold('ERROR'));
        reject(false);
      }
      console.log(`%s ${stdout.split('\n')[0]}`, chalk.green.bold('DONE'));
      resolve(true);
    }),
  );
}

const packageJsonPath = path.resolve('package.json');
if (fs.existsSync(packageJsonPath)) {
  console.log(`%s ${packageJsonPath} already exists`, chalk.yellow.bold('WARNING'));
} else {
  await new Promise((resolve, reject) =>
    exec('npm init -y', (error, stdout, stderr) => {
      if (error) {
        console.log(`%s ${error.message}`, chalk.red.bold('ERROR'));
        reject(false);
      }
      if (stderr) {
        console.log(`%s ${stderr}`, chalk.red.bold('ERROR'));
        reject(false);
      }
      console.log(`%s ${stdout.split('\n')[0]}`, chalk.green.bold('DONE'));
      resolve(true);
    }),
  );
}

const gitIgnorePath = path.resolve('.gitignore');
if (fs.existsSync(gitIgnorePath)) {
  console.log(`%s ${gitIgnorePath} already exists`, chalk.yellow.bold('WARNING'));
} else {
  fs.writeFileSync(
    gitIgnorePath,
    '.idea\n.vscode\n.DS_Store\n\n/node_modules\n/build\n\n**/*.local\n**/*.local.*\n\n**/*.env\n**/*.env.*\n!.env.example\n\n**/*.log',
  );
  console.log(`%s ${gitIgnorePath} created`, chalk.green.bold('DONE'));
}

const privateKeyName = process.env.PRIVATE_KEY;
if (!privateKeyName) {
  console.log(`%s PRIVATE_KEY not found in .env file`, chalk.red.bold('ERROR'));
  process.exit();
}

const keyPath = path.resolve(__dirname, process.env.PRIVATE_KEY);
if (!fs.existsSync(keyPath)) {
  console.log(`%s ${keyPath} not found`, chalk.red.bold('ERROR'));
  process.exit();
}

const privateKey = fs.readFileSync(keyPath, 'utf8');
if (!privateKey) {
  console.log(`%s ${keyPath} is empty`, chalk.red.bold('ERROR'));
  process.exit();
}

const repoName = path.basename(process.cwd());

const octokit = new Octokit({
  auth: privateKey,
});

try {
  // Check if repo name already exists
  const result = await octokit.request('GET /user/repos', {
    username: 'gobvoz',
    type: 'all',
  });

  const isNameExist = result.data.map(repo => repo.name).includes(repoName);
  if (isNameExist) {
    console.log(`%s repository ${repoName} already exists`, chalk.yellow.bold('ERROR'));
    process.exit();
  }

  // Create repo
  const response = await octokit.request('POST /user/repos', {
    name: repoName,
    description: '',
    homepage: '',
    private: false,
  });
  console.log(`%s ${response?.data?.html_url}`, chalk.green.bold('DONE'));

  const sshUrl = response?.data?.ssh_url;

  // Add remote
  if (sshUrl) {
    const addRemoteResult = await new Promise((resolve, reject) => {
      exec(`git remote add origin ${sshUrl}`, (error, stdout, stderr) => {
        if (error) {
          console.log(`%s ${error.message}`, chalk.red.bold('ERROR'));
          reject(false);
        }
        if (stderr) {
          console.log(`%s ${stderr}`, chalk.red.bold('ERROR'));
          reject(false);
        }
        console.log(`%s 'remote' for repository added`, chalk.green.bold('DONE'));
        resolve(true);
      });
    });
    if (!addRemoteResult) process.exit();
  } else {
    console.log(`%s ssh_url not found`, chalk.red.bold('ERROR'));
  }

  // Initial commit
  const result1 = await new Promise((resolve, reject) =>
    exec('git add . && git commit -m "Initial commit"', (error, stdout, stderr) => {
      if (error) {
        console.log(`%s ${error.message}`, chalk.red.bold('ERROR'));
        reject(false);
      }
      if (stderr) {
        console.log(`%s ${stderr}`, chalk.red.bold('ERROR'));
        reject(false);
      }
      console.log(`%s ${stdout.split('\n')[0]}`, chalk.green.bold('DONE'));
      resolve(true);
    }),
  );
  if (!result1) process.exit();
} catch (error) {
  console.log(`%s ${error.message}`, chalk.red.bold('ERROR'));
  process.exit();
}
