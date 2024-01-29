// Changing any of the below values is a breaking change!
export enum TypeName {
  CLIENT = 'Client',
  INVITE_TO_CLIENT = 'InviteToClient',
  MESSAGE = 'Message',
  INFO = 'Info',
  USER = 'User',
  PUBLIC_USER = 'PublicUser',
  USERS_CLIENT = 'UsersClient',
  ITEM = 'Item',
  TASK = 'Task',
  QUESTION = 'Question',
  GOAL = 'Goal',
  FILE = 'File',
}

export const DEFAULT_CLIENT_NAME = 'individual'

export enum PrismaErrorCode {
  UNIQUE_CONSTRAINT_FAILED = 'P2002',
}

export const VIEWING_FEED_POLL_INTERVAL_MS = 5000

export const VIEWING_FEED_GRACE_PERIOD_BEFORE_EXPIRY_MS = 3000

export const SECOND_IN_MS = 1000
export const MINUTE_IN_MS = 60 * SECOND_IN_MS
export const HOUR_IN_MS = 60 * MINUTE_IN_MS
export const DAY_IN_MS = 24 * HOUR_IN_MS
