#!/usr/bin/env node
import { Command } from 'commander';
import { runDoctor } from './commands/doctor.js';
import { runDeploy } from './commands/deploy.js';
import { runEmulators } from './commands/emulators.js';
import { runFirestoreCopy } from './commands/firestore-copy/index.js';
import { runFirestoreExport } from './commands/firestore-export.js';
import { runFirestoreInit } from './commands/firestore-init/index.js';
import { type InitOptions, runInit } from './commands/init/index.js';
import { runSetup } from './commands/setup.js';
import { runSetupGitHub } from './commands/setup-github.js';
import { githubAnnotation, validateSiteConfig } from './utils/site-config.js';
import { findRepoRoot } from './utils/node-version.js';

const program = new Command();

program
  .name('hoverboard')
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
  .option('--seed', 'Add the sample content after deploying, without asking.')
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
  .command('firestore-export')
  .description('Export the running Firestore emulator data to .firebase/emulator-data.')
  .action(() => {
    process.exitCode = runFirestoreExport() ? 0 : 1;
  });

program.parse();
