#!/usr/bin/env node
import { Command } from 'commander';
import { runDoctor } from './commands/doctor.js';
import { runFirestoreCopy } from './commands/firestore-copy/index.js';
import { runFirestoreInit } from './commands/firestore-init/index.js';

const program = new Command();

program
  .name('hoverboard')
  .description('CLI to help developers set up, run, and deploy Hoverboard.')
  .version('0.1.0');

program
  .command('doctor')
  .description('Validate the local environment is ready to run and deploy Hoverboard.')
  .action(() => {
    process.exitCode = runDoctor() ? 0 : 1;
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

program.parse();
