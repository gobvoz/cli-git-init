export const getArgs = () => {
  let returnedArgs = {};
  const args = process.argv.slice(2);

  args.forEach((arg, index) => {
    if (arg.startsWith('--')) {
      const key = arg.slice(2).toLowerCase();
      returnedArgs[key] = key === 'repo-name' ? args[index + 1] : true;
    }
  });

  return returnedArgs;
};
