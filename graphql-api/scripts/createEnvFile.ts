import { faker } from '@faker-js/faker'
import fs from 'node:fs'
import path from 'node:path'

const env = `
POSTGRES_USER="${faker.random.alphaNumeric(12)}"
POSTGRES_PASSWORD="${faker.random.alphaNumeric(12)}"
POSTGRES_DB="${faker.random.alphaNumeric(12)}"
DATABASE_URL="postgresql://$\{POSTGRES_USER}:$\{POSTGRES_PASSWORD}@localhost:5432/$\{POSTGRES_DB}?schema=public"
GOOGLE_APPLICATION_CREDENTIALS={}
`

fs.writeFileSync(path.resolve(__dirname, '../.env'), env)
