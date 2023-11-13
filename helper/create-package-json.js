import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';

import log from '../utils/log.js';

export const createPackageJson = async () => {
  // create package.json
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
};
