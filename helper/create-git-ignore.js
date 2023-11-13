import fs from 'fs';
import path from 'path';

import log from '../utils/log.js';

export const createGitIgnore = async git => {
  // try to create .gitignore
  const gitIgnorePath = path.resolve('.gitignore');
  if (fs.existsSync(gitIgnorePath)) {
    log.warning(`${gitIgnorePath} already exists`);
  } else {
    await git.addGitIgnore(gitIgnorePath);
    log.done(`${gitIgnorePath} created`);
  }
};
