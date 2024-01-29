# Graphql API

## Pre-requisites

This requires you to have `docker` installed on your machine as it uses `docker-compose`.

## Setup

Run `pnpm run create-env-file` to create a initial `.env` file, note - every time new .env file is generated you'll need to delete the docker image of the database and recreate it again, as it generates new credentials and the old one's (which are used in the docker image) are lost.

You will also need to fill in the `GOOGLE_APPLICATION_CREDENTIALS` env variable.

E.g. `GOOGLE_APPLICATION_CREDENTIALS={"type":"service_account","project_id":"myapp-123","private_key_id":"123", ...}`

## Start

Simply run `pnpm start` and you can access the graphql api on your `http://localhost:4000/`

## Changing `prisma/schema.prisma`

Every prisma.schema requires creating a new database migration and executing it, this can be done by running `pnpm run migrate:db`. This command requires the database to be running (run `pnpm run start:db` to start it).

## Changing `src/schema.graphql`

Every time graphql schema is changed you need to regenerate graphql types (which are used in the frontend as well). You can do that by running `pnpm generate-graphql-types`.
