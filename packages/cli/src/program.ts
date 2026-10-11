import { Command, CommanderError } from 'commander';
import type { DataCheckOptions } from './commands/data-check.js';
import type { InitOptions } from './commands/init/index.js';
import { type CommandResult, UsageError } from './lib/command.js';
import { sendOutputToStderr } from './lib/spawn.js';
import { setTarget, target } from './lib/target.js';
import { findRepoRoot } from './utils/node-version.js';
import { escapeAnnotation } from './utils/site-config.js';

const PRODUCTION = '--production';

interface Options {
  json?: boolean;
  production?: boolean;
  dryRun?: boolean;
  yes?: boolean;
  [key: string]: unknown;
}

type Outcome = CommandResult | boolean | void;

type Handler = (options: Options, args: string[]) => Promise<Outcome> | Outcome;

/** The command as typed, such as `data check`. */
const commandName = (command: Command): string =>
  command.parent?.parent ? `${commandName(command.parent)} ${command.name()}` : command.name();

const errorMessage = (error: unknown) => (error instanceof Error ? error.message : String(error));

/** Prints an error on stderr. Only programming errors get a stack trace. */
const reportError = (error: unknown) => {
  const message = errorMessage(error);
  console.error(
    process.env['GITHUB_ACTIONS'] === 'true'
      ? `::error title=hb::${escapeAnnotation(message)}`
      : `✘ ${message}`,
  );
  if (error instanceof TypeError || error instanceof ReferenceError || !(error instanceof Error)) {
    console.error(error);
  }
};

/**
 * Runs a command with the conventions every command shares: the target, `--json`, exit codes
 * (0 when it worked, 1 for a problem to fix, 2 for a usage error) and error messages.
 */
const run =
  (handler: Handler) =>
  async (...params: unknown[]): Promise<void> => {
    const command = params.at(-1) as Command;
    const options = command.optsWithGlobals<Options>();
    const args = params.slice(0, -2) as string[];
    const hasTarget = command.options.some((option) => option.long === PRODUCTION);
    const json = options.json === true;
    const log = console.log;
    if (json) {
      // stdout holds only the result.
      console.log = console.error;
      sendOutputToStderr(true);
    }
    let result: CommandResult;
    try {
      if (hasTarget) {
        if (process.env['FIRESTORE_TARGET'] === 'production' && !options.production) {
          throw new UsageError(
            'hb no longer reads FIRESTORE_TARGET. Add --production to use the Firebase project ' +
              'in site.json.',
          );
        }
        setTarget(options.production ? 'production' : 'emulator');
      }
      const outcome = await handler(options, args);
      result = typeof outcome === 'object' ? outcome : { ok: outcome !== false };
      process.exitCode = result.ok ? 0 : 1;
    } catch (error) {
      process.exitCode = error instanceof UsageError ? 2 : 1;
      result = { ok: false, error: errorMessage(error) };
      reportError(error);
    } finally {
      console.log = log;
      sendOutputToStderr(false);
    }
    if (json) {
      console.log(
        JSON.stringify({
          command: commandName(command),
          ...(hasTarget ? { target: target() } : {}),
          ...result,
        }),
      );
    }
  };

const withTarget = (command: Command) =>
  command.option(PRODUCTION, 'Use the Firebase project in site.json instead of the emulator.');

const withWrites = (command: Command) =>
  command
    .option('--dry-run', 'Show what would change, without changing it.')
    .option('-y, --yes', 'Change production without asking.');

const repoRoot = () => findRepoRoot(process.cwd()) ?? process.cwd();

/** Collects a repeated option, such as `--collection a --collection b`. */
const collect = (value: string, previous: string[] = []) => [...previous, value];

/** The command as it was run, for an export's manifest. */
const commandLine = () => ['hb', ...process.argv.slice(2)].join(' ');

/** The `hb` command line. Commands load their modules when they run, after the target is set. */
export const createProgram = (): Command => {
  const program = new Command();
  program
    .name('hb')
    .description('Set up, run and deploy a Hoverboard site.')
    .version('0.1.0')
    .option(
      '--json',
      'Print the result as one JSON object on stdout, and everything else on stderr.',
    )
    .exitOverride();

  program
    .command('doctor')
    .description('Check that this computer and the Firebase project are ready for Hoverboard.')
    .action(run(async () => (await import('./commands/doctor.js')).runDoctor()));

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
    .action(
      run(async (options) =>
        (await import('./commands/init/index.js')).runInit(options as InitOptions),
      ),
    );

  program
    .command('setup')
    .description(
      'Log in to Firebase and select a project for local development (docs/tutorials/00-set-up.md).',
    )
    .action(run(async () => (await import('./commands/setup.js')).runSetup()));

  program
    .command('setup-github')
    .description(
      'Let GitHub Actions deploy to the Firebase project in site.json with Workload Identity ' +
        'Federation, without a service account key.',
    )
    .option('--repo <owner/name>', 'The GitHub repository. Defaults to the origin remote.')
    .option('--dry-run', 'Only report what would change.')
    .action(
      run(async (options) =>
        (await import('./commands/setup-github.js')).runSetupGitHub({
          ...(options['repo'] ? { repo: options['repo'] as string } : {}),
          ...(options.dryRun ? { dryRun: true } : {}),
        }),
      ),
    );

  const config = program.command('config').description('Work with packages/config.');
  config
    .command('validate')
    .description('Check packages/config against the schemas, the same way the build does.')
    .action(
      run(async () => {
        const root = findRepoRoot(process.cwd());
        if (!root) throw new Error('Not in a Hoverboard repo.');
        const { githubAnnotation, validateSiteConfig } = await import('./utils/site-config.js');
        const errors = await validateSiteConfig(root);
        const inActions = process.env['GITHUB_ACTIONS'] === 'true';
        for (const error of errors) console.log(inActions ? githubAnnotation(error) : `✘ ${error}`);
        if (!errors.length) console.log('✔ packages/config is valid.');
        return { ok: !errors.length, errors };
      }),
    );

  const emulators = program.command('emulators').description('Run the local Firebase emulators.');
  emulators
    .command('start', { isDefault: true })
    .description('Start the emulators, with the Firestore data saved in .firebase/emulator-data.')
    .action(run(async () => (await import('./commands/emulators.js')).runEmulators()));
  emulators
    .command('save')
    .description('Save the running Firestore emulator data to .firebase/emulator-data.')
    .action(run(async () => (await import('./commands/emulators-save.js')).runEmulatorsSave()));

  withWrites(
    program
      .command('deploy')
      .description('Build and deploy Hoverboard to the Firebase project in site.json.'),
  ).action(run(async (options) => (await import('./commands/deploy.js')).runDeploy(options)));

  program
    .command('deploy-args')
    .description(
      'Print the arguments `firebase deploy` needs for site.json, such as `--except functions` ' +
        'when features.functions is false. The deploy workflow uses it.',
    )
    .action(
      run(async () => {
        const { firebaseDeployArgs } = await import('./utils/site-features.js');
        const args = firebaseDeployArgs(repoRoot());
        console.log(args.join(' '));
        return { ok: true, args };
      }),
    );

  program
    .command('audit-deps')
    .description(
      'Fail on high or critical advisories in production dependencies, except the accepted ones.',
    )
    .action(run(async () => (await import('./commands/audit-deps.js')).runAuditDeps()));

  const data = program
    .command('data')
    .description(
      'Work with the Firestore data, in the emulator or, with --production, the live site.',
    );

  withWrites(
    withTarget(
      data
        .command('seed')
        .description('Add the sample data in docs/sample-data, for the features that are on.'),
    ),
  ).action(run(async (options) => (await import('./commands/data-seed.js')).runDataSeed(options)));

  withWrites(
    withTarget(
      data
        .command('import')
        .argument('<folder>', 'An export from hb data export, or a backup.')
        .description(
          'Import an export into Firestore. Runs the data migrations it needs, checks every ' +
            'document, and backs up what it replaces. Keeps the documents the export ' +
            "doesn't have, unless --replace.",
        )
        .option(
          '--collection <path>',
          'Only this collection, such as speakers or partners/*/items. Repeat it for more.',
          collect,
        )
        .option(
          '--replace',
          "Also delete the documents of the imported collections that the export doesn't have.",
        ),
    ),
  ).action(
    run(async (options, [folder]) =>
      (await import('./commands/data-import.js')).runDataImport(folder!, {
        collection: (options['collection'] as string[] | undefined) ?? [],
        replace: options['replace'] === true,
        dryRun: options.dryRun === true,
        yes: options.yes === true,
        command: commandLine(),
      }),
    ),
  );

  withTarget(
    data
      .command('export')
      .argument(
        '[folder]',
        'Where to write it. Defaults to hoverboard-export-<time>, or the current folder with --csv.',
      )
      .description(
        'Export the Firestore data to a folder, with a manifest and one JSON file per collection.',
      )
      .option(
        '--collection <path>',
        'Only this collection, such as speakers or partners/*/items. Repeat it for more.',
        collect,
      )
      .option('--content', 'Only the content, without visitor, function or CLI data.')
      .option(
        '--all',
        "Also collections Hoverboard doesn't use, such as ones from earlier versions.",
      )
      .option('--csv', 'Write one CSV file per collection instead, such as subscribers.csv.'),
  ).action(
    run(async (options, [folder]) => {
      const collections = (options['collection'] as string[] | undefined) ?? [];
      if (options['csv']) {
        if (!collections.length) {
          throw new UsageError('--csv needs the collections, such as --collection subscribers.');
        }
        return (await import('./commands/data-csv.js')).runCsvExport(collections, folder);
      }
      return (await import('./commands/data-export.js')).runDataExport(folder, {
        collection: collections,
        content: options['content'] === true,
        all: options['all'] === true,
        command: commandLine(),
      });
    }),
  );

  withTarget(
    data
      .command('check')
      .description(
        'Check every document against the schema, and the sessions against the schedule. With ' +
          '--fix, run the data migrations and the safe fixes first, after backing up what they ' +
          'change.',
      )
      .option(
        '--collection <path>',
        'Check one collection, such as speakers or partners/gold/items.',
      )
      .option('--fix', 'Run the pending migrations and the safe fixes.')
      .option('--dry-run', 'With --fix, show the changes without writing them.')
      .option('-y, --yes', 'With --fix or --restore, change production without asking.')
      .option(
        '--restore <folder>',
        'Write back the documents a --fix backed up, from .firebase/backups.',
      ),
  ).action(
    run(async (options) =>
      (await import('./commands/data-check.js')).runDataCheck(options as DataCheckOptions),
    ),
  );

  withWrites(
    withTarget(
      program
        .command('upgrade')
        .description(
          'Move packages/config/site.json to the current schemaVersion, then run the Firestore ' +
            'data migrations and fixes, as data check --fix does.',
        ),
    ),
  ).action(run(async (options) => (await import('./commands/upgrade.js')).runUpgrade(options)));

  withWrites(
    withTarget(
      program
        .command('notify')
        .description(
          'Send a push notification to every device that turned on general notifications.',
        )
        .requiredOption('--title <text>', 'The title.')
        .requiredOption('--body <text>', 'The text under the title.')
        .option('--path <path>', 'The page it opens, such as /schedule, or a full https:// link.')
        .option('--icon <url>', 'An icon instead of the one in config/notifications.'),
    ),
  ).action(
    run(async (options) =>
      (await import('./commands/notify.js')).runNotify({
        ...options,
        title: options['title'] as string,
        body: options['body'] as string,
      }),
    ),
  );

  return program;
};

/** Runs the command in `argv`, and returns the exit code. */
export const main = async (argv: string[] = process.argv): Promise<number> => {
  try {
    await createProgram().parseAsync(argv);
  } catch (error) {
    if (!(error instanceof CommanderError)) throw error;
    // Commander has printed the help or the error. Anything but help and --version is a usage error.
    process.exitCode = error.exitCode === 0 ? 0 : 2;
  }
  return Number(process.exitCode ?? 0);
};
