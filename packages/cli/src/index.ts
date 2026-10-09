#!/usr/bin/env node
import { Command } from 'commander';
import { runAuditDeps } from './commands/audit-deps.js';
import { runDoctor } from './commands/doctor.js';
import { runDeploy } from './commands/deploy.js';
import { runEmulators } from './commands/emulators.js';
import { runFirestoreCopy } from './commands/firestore-copy/index.js';
import { runFirestoreCheck, type FirestoreCheckOptions } from './commands/firestore-check.js';
import { runFirestoreCsv } from './commands/firestore-csv.js';
import { runFirestoreExport } from './commands/firestore-export.js';
import { runFirestoreInit } from './commands/firestore-init/index.js';
import { type InitOptions, runInit } from './commands/init/index.js';
import { runSetup } from './commands/setup.js';
import { runSetupGitHub } from './commands/setup-github.js';
import { type UpgradeOptions, runUpgrade } from './commands/upgrade.js';
import { githubAnnotation, validateSiteConfig } from './utils/site-config.js';
import { findRepoRoot } from './utils/node-version.js';
import { firebaseDeployArgs } from './utils/site-features.js';

const program = new Command();

program
  .name('hb')
  .description('CLI to help developers set up, run, and deploy Hoverboard.')
  .version('0.1.0');

program
  .command('doctor')
  .description('Validate the local environment is ready to run and deploy Hoverboard.')
  .action(async () => {
    process.exitCode = (await runDoctor()) ? 0 : 1;
  });

program
  .command('init')
  .description(
    'Set up a new site: the Firebase project, the event details in packages/config, billing, ' +
      'and optionally the first deploy and sample content. Safe to re-run.',
  )
  .option('--project <id>', 'The Firebase project. Without it, pick from your projects.')
  .option('--create', 'Create the --project instead of using an existing one.')
  .option('--details <file>', 'A JSON file with the site details, instead of the questions.')
  .option('--deploy', 'Deploy without asking.')
  .option('--no-deploy', 'Skip the deploy.')
  .option('--seed', 'Add the sample content without asking.')
  .option('--no-seed', 'Skip the sample content.')
  .action(async (options: InitOptions) => {
    process.exitCode = (await runInit(options)) ? 0 : 1;
  });

program
  .command('setup')
  .description(
    'Log in to Firebase and select a project for local development (docs/tutorials/00-set-up.md).',
  )
  .action(async () => {
    process.exitCode = (await runSetup()) ? 0 : 1;
  });

program
  .command('setup-github')
  .description(
    'Let GitHub Actions deploy to the Firebase project in site.json with Workload Identity ' +
      'Federation, without a service account key.',
  )
  .option('--repo <owner/name>', 'The GitHub repository. Defaults to the origin remote.')
  .option('--dry-run', 'Only report what would change.')
  .action(async (options: { repo?: string; dryRun?: boolean }) => {
    process.exitCode = (await runSetupGitHub(options)) ? 0 : 1;
  });

program
  .command('validate-config')
  .description('Check packages/config against the schemas, the same way the build does.')
  .action(async () => {
    const repoRoot = findRepoRoot(process.cwd());
    const errors = repoRoot ? await validateSiteConfig(repoRoot) : ['Not in a Hoverboard repo.'];
    const inActions = process.env['GITHUB_ACTIONS'] === 'true';
    for (const error of errors) console.log(inActions ? githubAnnotation(error) : `✘ ${error}`);
    if (!errors.length) console.log('✔ packages/config is valid.');
    process.exitCode = errors.length ? 1 : 0;
  });

program
  .command('emulators')
  .description('Start the Firebase emulators, importing/exporting local Firestore data.')
  .action(() => {
    process.exitCode = runEmulators() ? 0 : 1;
  });

program
  .command('deploy')
  .description('Build and deploy Hoverboard to the Firebase project in site.json.')
  .option('-y, --yes', 'Skip the confirmation prompt.')
  .action(async (options: { yes?: boolean }) => {
    process.exitCode = (await runDeploy(options)) ? 0 : 1;
  });

program
  .command('deploy-args')
  .description(
    'Print the arguments `firebase deploy` needs for site.json, such as `--except functions` ' +
      'when features.functions is false. The deploy workflow uses it.',
  )
  .action(() => {
    console.log(firebaseDeployArgs(findRepoRoot(process.cwd()) ?? process.cwd()).join(' '));
  });

program
  .command('audit-deps')
  .description(
    'Fail on high or critical advisories in production dependencies, except the accepted ones.',
  )
  .action(() => {
    process.exitCode = runAuditDeps() ? 0 : 1;
  });

program
  .command('firestore-init')
  .description(
    'Seed the Firestore project from docs/default-firebase-data.json (targets the local ' +
      'emulator unless FIRESTORE_TARGET=production is set).',
  )
  .action(async () => {
    try {
      await runFirestoreInit();
    } catch (error) {
      console.log(error);
      process.exitCode = 1;
    }
  });

program
  .command('firestore-copy')
  .argument('<source>', 'A file path, or a Firestore collection/document path, to copy from.')
  .argument('<destination>', 'A file path, or a Firestore collection/document path, to copy to.')
  .description(
    'Copy Firestore data between a file and/or a collection/document path (targets the local ' +
      'emulator unless FIRESTORE_TARGET=production is set).',
  )
  .action(async (source: string, destination: string) => {
    try {
      await runFirestoreCopy(source, destination);
      console.log('Success! 🔥');
    } catch (error) {
      console.log('Error! 💩', error);
      process.exitCode = 1;
    }
  });

program
  .command('firestore-csv')
  .argument('<collection>', 'The collection, for example subscribers or potentialPartners.')
  .argument('[file]', 'The CSV file to write. Defaults to <collection>.csv.')
  .description(
    'Export a Firestore collection as CSV, with one row per document (targets the local ' +
      'emulator unless FIRESTORE_TARGET=production is set).',
  )
  .action(async (collection: string, file?: string) => {
    try {
      await runFirestoreCsv(collection, file);
    } catch (error) {
      console.log(error);
      process.exitCode = 1;
    }
  });

program
  .command('firestore-check')
  .description(
    'Check every Firestore document against the schema, and the sessions against the schedule ' +
      '(targets the local emulator unless FIRESTORE_TARGET=production is set). With --fix, run ' +
      'the data migrations and the safe fixes first, after backing up what they change.',
  )
  .option('--collection <path>', 'Check one collection, such as speakers or partners/gold/items.')
  .option('--fix', 'Run the pending migrations and the safe fixes.')
  .option('--dry-run', 'With --fix, show the changes without writing them.')
  .option('-y, --yes', 'With --fix or --restore, change production without asking.')
  .option(
    '--restore <folder>',
    'Write back the documents a --fix backed up, from .firebase/backups.',
  )
  .action(async (options: FirestoreCheckOptions) => {
    try {
      process.exitCode = (await runFirestoreCheck(options)) ? 0 : 1;
    } catch (error) {
      console.log(error);
      process.exitCode = 1;
    }
  });

program
  .command('firestore-export')
  .description('Export the running Firestore emulator data to .firebase/emulator-data.')
  .action(() => {
    process.exitCode = runFirestoreExport() ? 0 : 1;
  });

program
  .command('upgrade')
  .description(
    'Move packages/config/site.json to the current schemaVersion, then run the Firestore data ' +
      'migrations and fixes, as firestore-check --fix does (targets the local emulator unless ' +
      'FIRESTORE_TARGET=production is set).',
  )
  .option('--dry-run', 'Show the changes without writing them.')
  .option('-y, --yes', 'Change production Firestore without asking.')
  .action(async (options: UpgradeOptions) => {
    try {
      process.exitCode = (await runUpgrade(options)) ? 0 : 1;
    } catch (error) {
      console.log(error);
      process.exitCode = 1;
    }
  });

program.parse();
