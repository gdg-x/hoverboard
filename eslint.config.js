import { includeIgnoreFile } from '@eslint/compat';
import js from '@eslint/js';
import json from '@eslint/json';
import markdown from '@eslint/markdown';
import css from '@eslint/css';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';
import vitestPlugin from '@vitest/eslint-plugin';
import astroPlugin from 'eslint-plugin-astro';
import testingLibraryPlugin from 'eslint-plugin-testing-library';
import globals from 'globals';
import { resolve } from 'node:path';

export default defineConfig([
  includeIgnoreFile(resolve(import.meta.dirname, '.gitignore')),
  {
    ignores: [
      'packages/web/public/**',
      '**/package-lock.json', // Auto-generated lockfiles
      '**/.vscode/**', // VS Code settings (often contain comments)
    ],
  },

  {
    linterOptions: {
      reportUnusedDisableDirectives: 'error',
    },
  },

  // JavaScript files configuration (without TypeScript project)
  {
    files: ['**/*.{js,mjs}'],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      ...js.configs.recommended.rules,
    },
  },

  // TypeScript files configuration
  {
    files: ['**/*.{ts,tsx}'],
    // Scripts in .astro files, which eslint-plugin-astro lints without type information.
    ignores: ['**/*.astro/*.ts'],
    extends: [js.configs.recommended, tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        ...globals.browser,
        ServiceWorkerGlobalScope: true,
        // Feature flags, replaced at build time by packages/web/build/vite-plugin-site.ts
        __HB_FEATURES__: 'readonly',
      },
    },
    rules: {
      'preserve-caught-error': 'off',

      // TypeScript rules
      '@typescript-eslint/no-deprecated': 'error',
      '@typescript-eslint/switch-exhaustiveness-check': [
        'error',
        { considerDefaultExhaustiveForUnions: true },
      ],
      // Lit calls lifecycle methods such as `async firstUpdated()` without awaiting them.
      '@typescript-eslint/no-misused-promises': [
        'error',
        { checksVoidReturn: { inheritedMethods: false } },
      ],
      // Not yet: about 200 existing problems to fix first.
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      // Its fixes broke the type check: it misses narrowing, e.g. `initialState as State`.
      '@typescript-eslint/no-unnecessary-type-assertion': 'off',
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
    },
  },

  // Test files
  {
    files: ['**/*.test.ts', '**/__tests__/**/*.ts'],
    plugins: {
      vitest: vitestPlugin,
      'testing-library': testingLibraryPlugin,
    },
    languageOptions: {
      globals: globals.node,
    },
    rules: {
      'vitest/max-expects': ['warn', { max: 10 }],
      'vitest/unbound-method': 'warn',
      // Replaced by vitest/unbound-method, which allows `expect(mock.method)`.
      '@typescript-eslint/unbound-method': 'off',
      'testing-library/no-node-access': 'error',
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
    files: ['packages/web/build/**/*.{js,ts}'],
    languageOptions: {
      globals: {
        ...globals.node,
        process: 'readonly',
        Buffer: 'readonly',
      },
    },
  },

  // Astro pages and layouts
  ...astroPlugin.configs['flat/recommended'],

  // JSON files configuration with @eslint/json
  {
    files: ['**/*.json'],
    language: 'json/json',
    ...json.configs.recommended,
    rules: {
      // JSON formatting rules
      'json/no-duplicate-keys': 'error',
      'json/no-empty-keys': 'error',
      'json/no-unsafe-values': 'error',
    },
  },

  // JSONC files configuration (JSON with comments)
  {
    files: ['**/*.jsonc', '**/tsconfig*.json'],
    language: 'json/jsonc',
    ...json.configs.recommended,
    rules: {
      'json/no-duplicate-keys': 'error',
      'json/no-empty-keys': 'error',
      'json/no-unsafe-values': 'error',
      'json/no-comments': 'off', // Allow comments in JSONC
    },
  },

  // Node.js environment for functions
  {
    files: ['packages/server/functions/**/*.{js,ts}'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },

  // Node.js environment for the CLI package
  {
    files: ['packages/cli/**/*.{js,ts}'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },

  // Node.js environment for the storage rules/tests package
  {
    files: ['packages/storage/**/*.{js,ts}'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },

  // Config files at the root, such as this one and vitest.config.ts
  {
    files: ['*.{js,mjs,ts}'],
    languageOptions: {
      globals: globals.node,
    },
  },

  // Markdown files configuration with @eslint/markdown
  {
    files: ['**/*.md'],
    plugins: {
      markdown,
    },
    language: 'markdown/gfm',
    rules: {
      // Recommended markdown rules
      'markdown/no-html': 'warn',
      'markdown/no-invalid-label-refs': 'error',
      'markdown/no-duplicate-headings': 'error',
      'markdown/no-empty-links': 'error',
      'markdown/no-missing-label-refs': 'off', // Too strict for common patterns like [x], [e.g. ...]
    },
  },

  // Site content is rendered by the web app, which allows HTML such as buttons in blog posts
  {
    files: ['packages/{config,demo-config}/content/**/*.md'],
    rules: {
      'markdown/no-html': 'off',
    },
  },

  // CSS files configuration with @eslint/css
  {
    files: ['**/*.css'],
    language: 'css/css',
    ...css.configs.recommended,
    rules: {
      ...css.configs.recommended.rules,
      'css/no-empty-blocks': 'error',
      // Theme variables are written by the build, not declared in the CSS files.
      'css/no-invalid-properties': ['error', { allowUnknownVariables: true }],
      // The visual refresh uses features such as light-dark() and text-wrap: balance.
      'css/use-baseline': ['error', { available: 'newly' }],
    },
  },

  // Apply Prettier config last to override conflicting rules
  eslintConfigPrettier,
]);
