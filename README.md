# About

This repository contains a discontinued WIP MVP that was being built by [@benjaminhobbs](https://github.com/benjaminhobbs) (also the author of the idea) and [@saltenasl](https://github.com/saltenasl). [@benjaminhobbs](https://github.com/benjaminhobbs) worked mostly on the developer experience (github actions, heroku configs, nx config and similar) while [@saltenasl](https://github.com/saltenasl) was working on the rest.

## Rationale for making it public

The sole intention for making this public is to showcase our skills.

The development took place in a separate private repository, so the integrations (such as github actions) are not meant to work.

## The product

It was meant to bring people together when collaboration is beneficial and automate information exchange where people are unnecessary middlemen.

It could be better understood as a hybrid between project management and communication tools that provides a single-focus view for users to conduct their collaborative work. It was meant to allow you to safely avoid stale messages (you've been tagged on a thread that was already resolved) as well as unread messages are relatively irrelevant unless there's a defined expectation for you to read/respond/act in some way. It was also meant to disincentivize presenteeism and to be the single place for your day-to-day work-related information.

Built as a graph with highly structured data nodes it was meant to become a knowledge graph for the organization.

# contag

[![Test Coverage](https://api.codeclimate.com/v1/badges/86ac582fed32db668f0a/test_coverage)](https://)

The monorepo for Contag.

This is a `pnpm workspace`, see [relevant pnpm doc](https://pnpm.io/workspaces) to learn more about it.

## Table of contents

- [About](#about)
  - [Rationale for making it public](#rationale-for-making-it-public)
  - [The product](#the-product)
- [contag](#contag)
  - [Table of contents](#table-of-contents)
  - [Setup](#setup)
    - [nvm](#nvm)
    - [Install dependencies](#install-dependencies)
      - [Some notes re nx](#some-notes-re-nx)
    - [First run of the app](#first-run-of-the-app)
    - [Optional notes re deployment](#optional-notes-re-deployment)
    - [Graphql API](#graphql-api)
    - [Commands](#commands)
  - [Contributing](#contributing)
    - [Creating a new package](#creating-a-new-package)
    - [Git](#git)
      - [Commit messages](#commit-messages)

## Setup

### nvm

To specify the required node version this repo uses [a `.nvmrc` file in the root](https://github.com/nvm-sh/nvm#nvmrc). Firstly, you'll need to [install nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

Then to switch node version you can either use `nvm use` in the root directory or [you can configure your shell to pick up the version from `.nvmrc` automatically](https://github.com/nvm-sh/nvm#deeper-shell-integration) and switch it every time you `cd` into a directory.

### Install dependencies

We're using `pnpm` as our package manager, to install it you first need to `npm i -g pnpm` then you can install the dependencies of the monorepo by running `pnpm i`.

#### Some notes re nx

We also use nx for scripts and caching of those scripts. Due to use of pnpm you can use nx without global install, and also run it in VisualStudio Code (the extensions is recommended in this repo's settings).

Due to the way nx and pnpm work together you need to run commands in this format: `pnpm nx run-many --target=test --all`. They can also be run selectively with `pnpm nx run-many --target=build --projects=@contag/graphql-api,@contag/frontend`

To check dependency mapping in nx (important for reliability of its caching) run `pnpm nx graph`

For ease of use a variety of scripts has been added to the root package.json. A word of warning about skipping the cache on the nx script, if you're nesting the nx script remember pass the parameter down a level. e.g. if script A runs another script like `pnpm nx [...]` and you run `pnpm scriptA --skip-nx-cache` it won't, so instead use `pnpm scriptA -- --skip-nx-cache`. There are no current example of this in the repo as they're used only in the root for quick setup, this should be amended to benefit from caching within packages.

Improvements to consider:

- use further [nx packages](https://nx.dev/community#plugin-directory) for even more optimal support and caching - though it seems quite a few are used by default

  - Unclear if it's beneficial compared to the parent list item but, [better setup for typescript](https://jakeginnivan.medium.com/using-typescript-project-references-in-nx-b3462b2fe6d4)

- use [format:check](https://nx.dev/packages/nx/documents/format-check) and related commands instead of our lint setup now
- [package generator in nx](https://nx.dev/packages/nx/documents/generate) rather than custom package
- [nx cloud setup](https://nx.dev/recipes/ci/ci-setup)

### First run of the app

Prerequisites:

- **docker** installed and running - it is used to manage local db
- **env variables** are defined for frontend and graphql-api (check appropriate readme files)

To run the app, you need to start both graphql-api and frontend:

frontend

`pnpm --filter=frontend dev`

api

`pnpm --filter=graphql-api start:dev`

Note: graphql-api will run the docker-compose with the dockerized postgres.

You might want to run migrations if they didn't run automatically.

`pnpm --filter=graphql-api migrate:db`

### Optional notes re deployment

Deployment is automated on the main branch. Everything is on heroku.

All deployments are tracked in github.com. All env vars are manually added on the project.

CLI setup (useful in general and required for many config settings we use)

`brew tap heroku/brew && brew install heroku`

`heroku labs --app contag` is very useful to see logging and metrics config.

### Graphql API

To setup the Graphql API follow the instructions in [the packages README](./graphql-api/README.md).

### Commands

Most packages should have the following commands:

- `test` - runs jest tests
- `typecheck` - runs typescript typecheck
- `lint` - runs eslint linter

You can also execute these commands in the root and it will execute the same commands in every package where those are present.

## Contributing

This repo is built with a goal for VS Code to be configured and work out of the box.

### Creating a new package

To make creation of new packages easier we have `package-template` - it's a boiler plate package that should have all the initial configuration ready and can be copy-pasted to speed up the process of creating a new package.

### Git

This repo uses husky to power git hooks. It will execute various commands to ensure quality of the code before getting it into the source control.

#### Commit messages

Commit messages follow the [conventional commits standard](https://www.conventionalcommits.org/).
