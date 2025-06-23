import js from '@eslint/js';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import eslintConfigPrettier from 'eslint-config-prettier';
import htmlPlugin from 'eslint-plugin-html';
import htmlEslintPlugin from '@html-eslint/eslint-plugin';
import htmlEslintParser from '@html-eslint/parser';
import importPlugin from 'eslint-plugin-import';
import jestPlugin from 'eslint-plugin-jest';
import jestDomPlugin from 'eslint-plugin-jest-dom';
import testingLibraryPlugin from 'eslint-plugin-testing-library';
import globals from 'globals';

export default [
  // Base configuration for all files
  {
    ignores: ['dist/**', 'node_modules/**', 'functions/dist/**', 'public/**'],
  },

  // JavaScript files configuration (without TypeScript project)
  {
    files: ['**/*.{js,mjs}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es6,
      },
    },
    rules: {
      ...js.configs.recommended.rules,
    },
  },

  // TypeScript files configuration
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        project: ['./tsconfig.json', './functions/tsconfig.json'],
        sourceType: 'module',
        ecmaVersion: 2020,
      },
      globals: {
        ...globals.browser,
        ...globals.es6,
        ServiceWorkerGlobalScope: true,
      },
    },
    plugins: {
      '@typescript-eslint': typescriptEslint,
      import: importPlugin,
      jest: jestPlugin,
      'jest-dom': jestDomPlugin,
      'testing-library': testingLibraryPlugin,
    },
    rules: {
      ...js.configs.recommended.rules,

      // Disable conflicting rules
      'no-unused-vars': 'off', // Replaced by @typescript-eslint/no-unused-vars

      // Jest rules
      'jest/max-expects': ['warn', { max: 10 }],
      'jest/no-hooks': 'off',
      'jest/prefer-expect-assertions': 'off',
      'jest/require-hook': 'off',
      'jest/unbound-method': 'warn',

      // Testing library rules
      'testing-library/no-node-access': 'warn',

      // Import rules
      'import/no-unresolved': 'error',
      'import/named': 'error',
      'import/default': 'error',
      'import/export': 'error',

      // TypeScript rules
      '@typescript-eslint/unbound-method': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          args: 'all',
          argsIgnorePattern: '^_',
          caughtErrors: 'all',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],

      // Custom rules
      'brace-style': 'off',
      'new-cap': 'off',
      'no-var': 'error',
      'require-jsdoc': 'off',
      'max-len': ['error', { code: 120 }],
      'object-curly-spacing': ['error', 'always'],
      'space-before-function-paren': [
        'error',
        { anonymous: 'always', named: 'never', asyncArrow: 'always' },
      ],
      'linebreak-style': 0,
    },
    settings: {
      'import/parsers': {
        '@typescript-eslint/parser': ['.ts', '.tsx'],
      },
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: './tsconfig.json',
        },
      },
    },
  },

  // Service Worker files (allow importScripts)
  {
    files: ['**/*sw.{js,ts}', '**/service-worker*.{js,ts}', '**/firebase-messaging-sw.ts'],
    languageOptions: {
      globals: {
        ...globals.serviceworker,
        importScripts: 'readonly',
      },
    },
  },

  // Build utility files (Node.js environment)
  {
    files: ['utils/**/*.{js,ts}'],
    languageOptions: {
      globals: {
        ...globals.node,
        process: 'readonly',
        Buffer: 'readonly',
      },
    },
  },

  // HTML files configuration with @html-eslint/eslint-plugin
  {
    files: ['**/*.html'],
    languageOptions: {
      parser: htmlEslintParser,
    },
    plugins: {
      '@html-eslint': htmlEslintPlugin,
    },
    rules: {
      // Core HTML structure rules
      '@html-eslint/require-doctype': 'error',
      '@html-eslint/require-lang': 'error',
      '@html-eslint/require-title': 'error',
      '@html-eslint/require-meta-charset': 'error',
      '@html-eslint/require-meta-viewport': 'error',
      '@html-eslint/no-multiple-h1': 'error',
      '@html-eslint/require-closing-tags': ['error', { selfClosing: 'always' }],
      '@html-eslint/no-script-style-type': 'error',

      // Formatting rules (more lenient)
      '@html-eslint/no-inline-styles': 'warn',
      '@html-eslint/element-newline': 'off', // Too strict for templates
      '@html-eslint/indent': 'off', // Let Prettier handle this
      '@html-eslint/quotes': ['error', 'double'],
      '@html-eslint/no-extra-spacing-attrs': 'off', // Too strict for templates
      '@html-eslint/attrs-newline': 'off', // Too strict for templates

      // Accessibility rules
      '@html-eslint/require-img-alt': 'error',
      '@html-eslint/no-target-blank': 'error',
      '@html-eslint/require-button-type': 'error',
    },
  },

  // Legacy HTML plugin for embedded scripts in HTML
  {
    files: ['**/*.html'],
    plugins: {
      html: htmlPlugin,
    },
  },

  // Node.js environment for functions
  {
    files: ['functions/**/*.{js,ts}'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },

  // Node.js environment for scripts
  {
    files: ['scripts/**/*.{js,ts}'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },

  // Test files configuration
  {
    files: ['__tests__/**/*.{js,ts}', '**/*.test.{js,ts}', '**/*.spec.{js,ts}'],
    languageOptions: {
      globals: {
        ...globals.node,
        firebase: true,
      },
    },
  },

  // Icons specific configuration
  {
    files: ['src/utils/icons/**/*.{js,ts}'],
    rules: {
      'max-len': 'off',
    },
  },

  // Apply Prettier config last to override conflicting rules
  eslintConfigPrettier,
];
