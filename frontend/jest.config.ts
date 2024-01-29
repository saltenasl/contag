import { Config } from 'jest'
import { compilerOptions } from './tsconfig.json'

const config: Config = {
  transform: {
    '^.+\\.(t|j)sx?$': [
      '@swc/jest',
      {
        jsc: {
          transform: {
            react: {
              runtime: 'automatic',
            },
          },
        },
      },
    ],
  },
  collectCoverage: true,
  collectCoverageFrom: [
    '<rootDir>/src/**/*.{ts,tsx}',
    '!<rootDir>/src/generated/**/*.{ts,tsx}',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: [['lcov', { projectRoot: '..' }]],
  resetMocks: true,
  testEnvironment: 'jsdom',
  resolver: '<rootDir>/test/config/resolver.js',
  testMatch: ['**/*.test.ts?(x)'],
  setupFilesAfterEnv: ['<rootDir>/test/config/setup.ts'],
  modulePaths: [compilerOptions.baseUrl],
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1',
    '\\.css$': '<rootDir>/test/config/cssTransform.js',
  },
  testTimeout: 25000,
  globals: {
    'ts-jest': {
      isolatedModules: true,
    },
  },
}

export default config
