import type { Config } from 'jest'
import { compilerOptions } from './tsconfig.json'

const config: Config = {
  transform: {
    '^.+\\.tsx?$': '@swc/jest',
  },
  collectCoverage: true,
  collectCoverageFrom: [
    '<rootDir>/src/**/*.{ts,tsx}',
    '!<rootDir>/src/generated/**/*.{ts,tsx}',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: [['lcov', { projectRoot: '..' }]],
  resetMocks: true,
  testEnvironment: 'node',
  testMatch: ['**/*.test.ts?(x)'],
  modulePaths: [compilerOptions.baseUrl],
  moduleNameMapper: { '^src/(.*)$': '<rootDir>/src/$1' },
  setupFilesAfterEnv: ['./test/config/setupTests.ts'],
  testTimeout: 12500, // longest running test on busy slow machine is about 10000, this gives 2500 grace period
}

export default config
