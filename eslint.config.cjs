const { defineConfig } = require('eslint/config');
const universe = require('eslint-config-universe/flat/native');
const universeWeb = require('eslint-config-universe/flat/web');

module.exports = defineConfig([
  // The example app and generated/build artifacts have their own tooling.
  { ignores: ['build', 'example', 'internal', 'plugin/build'] },
  ...universe,
  ...universeWeb,
  {
    // Jest globals for tests and manual mocks.
    files: ['**/__tests__/**/*', '**/__mocks__/**/*'],
    languageOptions: {
      globals: {
        jest: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeAll: 'readonly',
        beforeEach: 'readonly',
        afterAll: 'readonly',
        afterEach: 'readonly',
      },
    },
  },
  {
    // The config plugin and its entry file run in Node (CommonJS).
    files: ['plugin/**/*.ts', 'app.plugin.js'],
    languageOptions: {
      globals: {
        module: 'writable',
        require: 'readonly',
        process: 'readonly',
        console: 'readonly',
        __dirname: 'readonly',
      },
    },
  },
]);
