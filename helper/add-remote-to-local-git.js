import log from '../utils/log.js';

export const addRemoteToLocalGit = async (newRepo, git) => {
  // Add remote
  const sshUrl = newRepo.ssh_url;
  if (sshUrl) {
    await git.addRemote(sshUrl);
  } else {
    log.error(`ssh_url not found`);
  }
};
