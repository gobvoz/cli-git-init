#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import url from 'url';
import { exec } from 'child_process';
import dotenv from 'dotenv';
import clear from 'clear';
import figlet from 'figlet';
import { Octokit } from 'octokit';

import log from './utils/log.js';

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  fs.writeFileSync(
    gitIgnorePath,
    '.idea\n.vscode\n.DS_Store\n\n/node_modules\n/build\n\n**/*.local\n**/*.local.*\n\n**/*.env\n**/*.env.*\n!.env.example\n\n**/*.log',
  );
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

const repoName = path.basename(process.cwd());

const octokit = new Octokit({
  auth: privateKey,
});

try {
  // Check if repo name already exists
  const result = await octokit.request('GET /user/repos', {
    type: 'all',
  });

  const isNameExist = result.data.map(repo => repo.name).includes(repoName);
  if (isNameExist) {
    log.error(`repository ${repoName} already exists`);
    process.exit();
  }

  // Create repo
  const response = await octokit.request('POST /user/repos', {
    name: repoName,
    description: '',
    homepage: '',
    private: false,
  });
  log.done(`${response?.data?.html_url}`);

  const sshUrl = response?.data?.ssh_url;

  // Add remote
  if (sshUrl) {
    const addRemoteResult = await new Promise((resolve, reject) => {
      exec(`git remote add origin ${sshUrl}`, (error, stdout, stderr) => {
        if (error) {
          log.error(`${error.message}`);
          reject(false);
        }
        if (stderr) {
          log.error(stderr);
          reject(false);
        }
        log.done(`'remote' for repository added`);
        resolve(true);
      });
    });
    if (!addRemoteResult) process.exit();
  } else {
    log.error(`ssh_url not found`);
  }

  // Initial commit
  const result1 = await new Promise((resolve, reject) =>
    exec('git add . && git commit -m "Initial commit"', (error, stdout, stderr) => {
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
  if (!result1) process.exit();
} catch (error) {
  log.error(error.message);
  process.exit();
}
