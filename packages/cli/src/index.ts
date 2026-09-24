#!/usr/bin/env node
import { Command } from 'commander';
import { runDoctor } from './commands/doctor.js';

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

program.parse();
