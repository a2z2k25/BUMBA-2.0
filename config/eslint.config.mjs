// ESLint v9 Configuration
import js from '@eslint/js';

export default [
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        exports: 'writable',
        module: 'writable',
        require: 'readonly',
        global: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        Promise: 'readonly',
      }
    },
    rules: {
      'no-unused-vars': ['error', { 
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_'
      }],
      'no-console': 'off',
      'no-debugger': 'error',
      'no-duplicate-case': 'error',
      'no-empty': 'error',
      'no-extra-semi': 'error',
      'no-func-assign': 'error',
      'no-irregular-whitespace': 'error',
      'no-unreachable': 'error',
      'curly': 'error',
      'dot-notation': 'error',
      'eqeqeq': ['error', 'always'],
      'no-empty-function': 'error',
      'no-multi-spaces': 'error',
      'no-mixed-spaces-and-tabs': 'error',
      'indent': 'off', // Too many existing files to fix now
      'linebreak-style': ['error', 'unix'],
      'quotes': ['error', 'single', { avoidEscape: true }],
      'semi': ['error', 'always']
    }
  },
  {
    files: ['**/*.test.js', '**/*.spec.js'],
    rules: {
      'no-unused-expressions': 'off'
    }
  },
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'build/**',
      'coverage/**',
      '*.min.js',
      'config/*.js'
    ]
  }
];