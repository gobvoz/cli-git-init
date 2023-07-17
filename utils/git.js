import fs from 'fs';
import { exec } from 'child_process';
import { Octokit } from 'octokit';

import log from './log.js';

export default class Git {
  constructor(privateKey) {
    this._octokit = new Octokit({
      auth: privateKey,
    });

    this.getGitRepoList = this.getGitRepoList.bind(this);
    this.createRepo = this.createRepo.bind(this);
    this.addRemote = this.addRemote.bind(this);
    this.createInitialCommit = this.createInitialCommit.bind(this);
  }

  static init = async () =>
    new Promise((resolve, reject) =>
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

  static addGitIgnore = async gitIgnorePath =>
    fs.writeFileSync(
      gitIgnorePath,
      '.idea\n.vscode\n.DS_Store\n\n/node_modules\n/build\n\n**/*.local\n**/*.local.*\n\n**/*.env\n**/*.env.*\n!.env.example\n\n**/*.log',
    );

  getGitRepoList = async () =>
    this._octokit.request('GET /user/repos', {
      type: 'all',
      per_page: 1000,
    });

  createRepo = async repoName =>
    this._octokit.request('POST /user/repos', {
      name: repoName,
      description: '',
      homepage: '',
      private: false,
    });

  addRemote = async sshUrl =>
    new Promise((resolve, reject) =>
      exec(`git remote add origin ${sshUrl}`, (error, stdout, stderr) => {
        if (error) {
          log.error(`${error.message}`);
          reject(false);
        } else if (stderr) {
          log.error(stderr);
          reject(false);
        } else {
          log.done('"remote for repository added');
          resolve(true);
        }
      }),
    );

  createInitialCommit = async () =>
    new Promise((resolve, reject) =>
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
}
