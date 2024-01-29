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
}

export default config
