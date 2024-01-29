module.exports = {
  env: {
    node: true,
  },

  extends: [
    'eslint:recommended',
    'plugin:jest/recommended',
    'prettier',
    'plugin:testing-library/react',
  ],
  parser: '@typescript-eslint/parser',
  plugins: [
    '@typescript-eslint',
    'jest',
    'eslint-plugin-testing-library',
    'eslint-plugin-jest-dom',
  ],
  rules: {
    'jest/prefer-strict-equal': 'error',
  },
  ignorePatterns: ['dist/**'],

  overrides: [
    {
      files: ['**.ts', '**.tsx'],
      extends: ['plugin:@typescript-eslint/recommended', 'prettier'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'error',
        '@typescript-eslint/no-unused-vars': 'error',
        '@typescript-eslint/no-unused-vars': [
          'error',
          { varsIgnorePattern: '^_' },
        ],
        '@typescript-eslint/no-empty-function': 'off',
        'jest/no-conditional-expect': 'off',
      },
    },
  ],
}
