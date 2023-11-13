#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import url from 'url';
import dotenv from 'dotenv';
import clear from 'clear';
import figlet from 'figlet';

import log from './utils/log.js';
import Git from './utils/git.js';
import { getArgs } from './utils/args.js';

import { createPackageJson } from './helper/create-package-json.js';
import { createGitIgnore } from './helper/create-git-ignore.js';
import { addRemoteToLocalGit } from './helper/add-remote-to-local-git.js';
import { createInitialCommit } from './helper/create-initial-commit.js';
import { getGitRepoName } from './helper/get-git-repo-name.js';
import { createGitRepo } from './helper/create-git-repo.js';

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
  log.error(`${keyPath} is empty. Please add gitHub API key to the file`);
  process.exit();
}

const git = new Git(privateKey);

if (fs.existsSync('.git')) {
  log.warning(`Already a Git repository!`);
} else {
  await Git.init();
}

await createPackageJson();
await createGitIgnore(git);

let repoName = await getGitRepoName(args, git);
repoName = await createGitRepo(repoName, args, git);

const result = await git.getGitRepoList();
const newRepo = result.data.find(repo => repo.name === repoName);

if (!newRepo) {
  log.error(`repository "${repoName}" not found`);
  process.exit();
}

await addRemoteToLocalGit(newRepo, git);
await createInitialCommit(args, git);

log.done(`All done!`);
