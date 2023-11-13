import inquirer from 'inquirer';

import log from '../utils/log.js';

export const createGitRepo = async (repoName, args, git) => {
  // Create repo
  // if repo name not provided in args - ask user
  if (!args['repo-name']) {
    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'Repository not found. What do you want to do',
        choices: [
          { name: 'Create repository with name like folder name', value: 'create' },
          { name: 'Enter name for new repository', value: 'new-name' },
          { name: "Don't create new repository", value: 'exit' },
        ],
      },
    ]);

    if (action === 'new-name') {
      const { name } = await inquirer.prompt([
        {
          type: 'input',
          name: 'name',
          message: 'Enter new repository name:',
        },
      ]);

      repoName = name;
    }

    if (action !== 'exit') {
      await git.createRepo(repoName);
      log.done(`Repository "${repoName}" created`);
    }
  } else {
    // if repo name provided in args - create repo with this name
    await git.createRepo(repoName);
    log.done(`Repository "${repoName}" created`);
  }

  return repoName;
};
