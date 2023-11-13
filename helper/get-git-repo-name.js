import path from 'path';
import inquirer from 'inquirer';

import log from '../utils/log.js';

export const getGitRepoName = async (args, git) => {
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
        if (args['no-initial-commit'])
          log.info(`initial commit will be skipped, because repository already exists`);

        // add prevent initial commit param
        args['no-initial-commit'] = true;
        break;
      }

      if (action === 'exit') {
        log.done(`Program terminated.`);
        process.exit();
      }
    }

    break;
  } while (true);

  return repoName;
};
