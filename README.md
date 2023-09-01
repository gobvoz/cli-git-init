# cli-git-init

A simple utility that allows you to easy initialize a git repository, create a github repository, create a default git ignore file, and perform an initial commit.

## Installation

```sh
npm install @gobvoz/cli-git-init -g
```

Copy `.env.example` file to `.env` and set up variables.
Create `git-init.pem` file and write your gitHub API key to grant read and create repositories access.

## Usage

```sh
git-init
```

- Initialize empty Git repository in current folder;
- Write default package.json
- create .gitignore
- create gitHub repository with same name
- add remote for repository
- add initial commit

```sh
git-init --no-initial-commit
```

Skip initial commit

```sh
git-init --repo-name [new-repo-name]
```

Create new repository with specified name
