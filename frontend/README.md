# Contag frontend app

## Setup

You'll need to create a `.env` file and fill the variables.

At the time of writing there are:

```
FIREBASE_API_KEY=
FIREBASE_AUTH_DOMAIN=
FIREBASE_PROJECT_ID=
FIREBASE_STORAGE_BUCKET=
IS_DEV_MODE=true
# local api
GRAPHQL_API_URL="/api"
```

**Important**
Reach out to someone who already has the codebase set-up to get access to firebase console where you can retrieve these.

## GraphQL Types

Every time the api schema is changed you need to re-generate the graphql types using `pnpm generate-graphql-types`. We do commit these types in source control, so if you haven't changed the `schema.graphql` in the `graphql-api` you don't need to generate the types. Types are also generated every time you run `pnpm typecheck`.

## Start

To start the development server run `pnpm dev`.

## Tests

Tests are ran using `pnpm test`, there's a watcher you can start it by running `pnpm test:watch`. Tests are using `jest` and are slow, I will investigate this in the future, though you can run tests with `-- --isolate=false` to make them faster right now(this doesn't work in watch mode).
