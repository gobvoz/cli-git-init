import inquirer from 'inquirer';

import log from '../utils/log.js';

export const createInitialCommit = async (args, git) => {
  // Initial commit
  if (args['no-initial-commit']) {
    log.info(`initial commit skipped`);
  } else {
    // ask user to create initial commit
    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'Do you want to create initial commit?',
        choices: [
          { name: 'Yes, create initial commit', value: 'yes' },
          { name: 'No, do not create initial commit', value: 'no' },
        ],
      },
    ]);

    if (action === 'yes') {
      if (!(await git.createInitialCommit())) log.error(`Can't make initial commit`);
    } else {
      log.info(`initial commit skipped`);
    }
  }
};
