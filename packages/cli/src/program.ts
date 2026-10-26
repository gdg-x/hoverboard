import { Command, CommanderError } from 'commander';
import type { ScheduleOptions } from './commands/backup.js';
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
    .option('--no-seed', 'Start with empty collections.')
    .option('--from <export>', "Start with the content of an export, such as last year's site.")
    .option(
      '--location <id>',
      'Where to create the Firestore database, when the project has none, such as eur3.',
    )
    .option('--logo <file>', 'Copy this SVG into packages/config as the header logo.')
    .option('--icon <file>', 'Copy this PNG of at least 512×512 pixels, or SVG, as the icon.')
    .option('--share-image <file>', 'Copy this JPEG or PNG as the image for link previews.')
    .option('--repo <owner/name>', 'Create this private GitHub repository for the site.')
    .option('--no-repo', 'Skip the GitHub repository.')
    .option('--backups', 'Schedule daily backups on the Blaze plan without asking.')
    .option('--no-backups', 'Skip the backup schedule.')
    .action(
      run(async (options) =>
        (await import('./commands/init/index.js')).runInit(options as InitOptions),
      ),
    );

  program
    .command('status')
    .description(
      'Show the project, the site URL, the versions, the features, the last deploy, your ' +
        'changes to Hoverboard, the document count of each collection and the stages the site is in.',
    )
    .option(PRODUCTION, 'Count the documents in the Firebase project instead of the emulator.')
    .action(run(async () => (await import('./commands/status.js')).runStatus()));

  program
    .command('setup')
    .description(
      'Log in to Firebase and select a project for local development (docs/tutorials/00-set-up.md).',
    )
    .action(run(async () => (await import('./commands/setup.js')).runSetup()));

  withWrites(
    program
      .command('setup-github')
      .description(
        'Let GitHub Actions deploy to the Firebase project in site.json with Workload Identity ' +
          'Federation, without a service account key, using firebase-wif.',
      )
      .option('--repo <owner/name>', 'The GitHub repository. Defaults to the origin remote.')
      .option(
        '--project <id>',
        "Deploy to this project instead, such as a new edition's. It reuses the existing deploy account.",
      ),
  ).action(
    run(async (options) =>
      (await import('./commands/setup-github.js')).runSetupGitHub({
        ...(options['repo'] ? { repo: options['repo'] as string } : {}),
        ...(options['project'] ? { project: options['project'] as string } : {}),
        dryRun: options.dryRun === true,
        yes: options.yes === true,
      }),
    ),
  );

  const config = program.command('config').description("Work with the site's config.");
  config
    .command('validate')
    .description('Check packages/config against the schemas, the same way the build does.')
    .action(
      run(async () => {
        const root = findRepoRoot(process.cwd());
        if (!root) throw new Error('Not in a Hoverboard repo.');
        const { githubAnnotation, validateSiteConfig } = await import('./utils/site-config.js');
        const { siteConfigDir } = await import('./utils/firebase-project.js');
        const dir = siteConfigDir(root);
        const errors = await validateSiteConfig(root);
        const inActions = process.env['GITHUB_ACTIONS'] === 'true';
        for (const error of errors) {
          console.log(inActions ? githubAnnotation(error, dir) : `✘ ${error}`);
        }
        if (!errors.length) console.log(`✔ ${dir} is valid.`);
        return { ok: !errors.length, errors };
      }),
    );
  config
    .command('project-id')
    .description(
      'Print the Firebase project to deploy to, for workflows. Fails on the demo config, unless ' +
        'HB_DEMO is true.',
    )
    .action(
      run(async () => {
        const { demoDeployProblem, resolveFirebaseProjectId } =
          await import('./utils/firebase-project.js');
        const problem = demoDeployProblem(repoRoot());
        if (problem) throw new Error(problem);
        const projectId = resolveFirebaseProjectId(repoRoot());
        if (!projectId)
          throw new Error('No Firebase project. Set firebase.projectId in site.json.');
        console.log(projectId);
        return { ok: true, projectId };
      }),
    );
  config
    .command('url')
    .description(
      "Print the site's address, for workflows: url in site.json, or the project's .web.app " +
        'address.',
    )
    .action(
      run(async () => {
        const { siteUrl } = await import('./utils/firebase-project.js');
        const url = siteUrl(repoRoot());
        if (!url) throw new Error('No Firebase project. Set firebase.projectId in site.json.');
        console.log(url);
        return { ok: true, url };
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
        .description('Add the sample data in docs/sample-data, for the features that are on.')
        .option(
          '--stage <fixture>',
          "Replace the emulator's content with a stage fixture, such as first-call or " +
            'returning-live, to preview that stage of the demo.',
        ),
    ),
  ).action(
    run(async (options) => {
      const seed = await import('./commands/data-seed.js');
      return typeof options['stage'] === 'string'
        ? seed.runStageSeed(options['stage'], options)
        : seed.runDataSeed(options);
    }),
  );

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

  data
    .command('pull')
    .description(
      "Copy production's content into the running emulator, replacing the emulator's. Visitor " +
        'data stays in production.',
    )
    .option(
      '--collection <path>',
      'Only this collection, such as sessions or partners/*/items. Repeat it for more.',
      collect,
    )
    .option('--dry-run', 'Show what would change, without changing it.')
    .action(
      run(async (options) =>
        (await import('./commands/data-sync.js')).runDataPull({
          collection: (options['collection'] as string[] | undefined) ?? [],
          dryRun: options.dryRun === true,
        }),
      ),
    );

  withWrites(
    data
      .command('push')
      .description(
        "Copy the emulator's content to production, replacing production's. Shows the changes, " +
          'backs up what it replaces, and asks first.',
      )
      .option(
        '--collection <path>',
        'Only this collection, such as sessions or partners/*/items. Repeat it for more.',
        collect,
      ),
  ).action(
    run(async (options) =>
      (await import('./commands/data-sync.js')).runDataPush({
        collection: (options['collection'] as string[] | undefined) ?? [],
        dryRun: options.dryRun === true,
        yes: options.yes === true,
      }),
    ),
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
      .option('-y, --yes', 'With --fix, change production without asking.'),
  ).action(
    run(async (options) =>
      (await import('./commands/data-check.js')).runDataCheck(options as DataCheckOptions),
    ),
  );

  const backup = program
    .command('backup')
    .description(
      'Back up and restore the Firestore data and the Auth users, and schedule backups in ' +
        'Firestore.',
    );

  withTarget(
    backup
      .command('create')
      .description(
        'Back up every Firestore document to .firebase/backups/<time>, and on production the ' +
          'Auth users.',
      )
      .option('--no-auth', 'Leave out the Auth users.'),
  ).action(
    run(async (options) =>
      (await import('./commands/backup.js')).runBackupCreate({ auth: options['auth'] !== false }),
    ),
  );

  withTarget(
    backup
      .command('list')
      .description(
        'List the backups in .firebase/backups and, with --production, the schedules and the ' +
          'backups in Firestore.',
      ),
  ).action(run(async () => (await import('./commands/backup.js')).runBackupList()));

  withWrites(
    withTarget(
      backup
        .command('restore')
        .argument(
          '<backup>',
          'A folder, or its name in .firebase/backups. For a backup in Firestore, its name ' +
            '(projects/…/backups/…) prints the steps.',
        )
        .description(
          'Write a backup back, as it is: replace the collections a full backup has, or undo ' +
            'the changes of a fix, import or restore. Backs up what it replaces first. On ' +
            'production, adds the Auth users the project no longer has.',
        )
        .option('--no-auth', "Don't restore the Auth users.")
        .option('--overwrite-users', 'Also replace the Auth users that exist.'),
    ),
  ).action(
    run(async (options, [name]) =>
      (await import('./commands/backup.js')).runBackupRestore(name!, {
        dryRun: options.dryRun === true,
        yes: options.yes === true,
        auth: options['auth'] !== false,
        overwriteUsers: options['overwriteUsers'] === true,
      }),
    ),
  );

  withWrites(
    backup
      .command('schedule')
      .description(
        'Back up the production database on a schedule, in Firestore. Needs the Blaze plan, ' +
          'and the backups are billed for storage.',
      )
      .option('--daily', 'Back up every day.')
      .option('--weekly [day]', 'Back up every week, on Sunday or the day given.')
      .option(
        '--retention <days>',
        'Days to keep each backup: up to 7 for daily, 98 for weekly. 7 or 28 by default.',
      )
      .option('--pitr', 'Also turn on point-in-time recovery, for the last 7 days.')
      .option('--disable', 'Delete the schedules, and turn point-in-time recovery off.'),
  ).action(
    run(async (options) =>
      (await import('./commands/backup.js')).runBackupSchedule(options as ScheduleOptions),
    ),
  );

  const editor = program
    .command('editor')
    .description(
      'Let content editors edit Firestore in the Firebase console of the project in site.json, ' +
        'without access to billing, functions or deploys.',
    );

  editor
    .command('list')
    .description('List the content editors.')
    .action(run(async () => (await import('./commands/editor.js')).runEditorList()));

  withWrites(
    editor
      .command('add')
      .argument('<email>', "The editor's Google account.")
      .description('Make someone a content editor.'),
  ).action(
    run(async (options, [email]) =>
      (await import('./commands/editor.js')).runEditorAdd(email!, {
        dryRun: options.dryRun === true,
        yes: options.yes === true,
      }),
    ),
  );

  withWrites(
    editor
      .command('remove')
      .argument('<email>', "The editor's Google account.")
      .description("Remove someone's content editor access."),
  ).action(
    run(async (options, [email]) =>
      (await import('./commands/editor.js')).runEditorRemove(email!, {
        dryRun: options.dryRun === true,
        yes: options.yes === true,
      }),
    ),
  );

  const edition = program
    .command('edition')
    .description(
      'Start the next edition in a new Firebase project, and keep the earlier ones online as ' +
        'read-only archives.',
    );

  edition
    .command('list')
    .description(
      'List the archived editions in packages/config/editions.json, and the current one.',
    )
    .action(run(async () => (await import('./commands/edition.js')).runEditionList()));

  withWrites(
    edition
      .command('new')
      .description(
        'Prepare the next edition in a new Firebase project: back up and tag this one, create the ' +
          'project, copy what carries over, point site.json at it and deploy it. The current site ' +
          "doesn't change.",
      )
      .option('--project <id>', "The next edition's Firebase project. Created when missing."),
  ).action(
    run(async (options) =>
      (await import('./commands/edition.js')).runEditionNew({
        ...(options['project'] ? { project: options['project'] as string } : {}),
        dryRun: options.dryRun === true,
        yes: options.yes === true,
      }),
    ),
  );

  withWrites(
    edition
      .command('switch')
      .description(
        'Once the domain points at the new edition, archive the previous one: copy what visitors ' +
          'wrote since, delete its functions and what moved, deploy the archive rules and its ' +
          'archived build, and move the backup schedule.',
      )
      .option('--archive-url <url>', "The archive's address. Its project's .web.app by default."),
  ).action(
    run(async (options) =>
      (await import('./commands/edition.js')).runEditionSwitch({
        ...(options['archiveUrl'] ? { archiveUrl: options['archiveUrl'] as string } : {}),
        dryRun: options.dryRun === true,
        yes: options.yes === true,
      }),
    ),
  );

  withTarget(
    edition
      .command('feedback')
      .argument('[year]', 'An archived edition. The current one by default.')
      .description(
        "Write each session's ratings and comments to a CSV file, to send to the speakers.",
      )
      .option('--folder <path>', 'Where to write them. feedback-<year> by default.'),
  ).action(
    run(async (options, [year]) =>
      (await import('./commands/edition.js')).runEditionFeedback(year, {
        ...(options['folder'] ? { folder: options['folder'] as string } : {}),
      }),
    ),
  );

  withWrites(
    edition
      .command('rebuild')
      .argument('<year>', 'The archived edition.')
      .description(
        'Build an archived edition again from its tag, and deploy it to its project, such as ' +
          'after a security fix.',
      ),
  ).action(
    run(async (options, [year]) =>
      (await import('./commands/edition.js')).runEditionRebuild(year!, {
        dryRun: options.dryRun === true,
        yes: options.yes === true,
      }),
    ),
  );

  withWrites(
    withTarget(
      program
        .command('upgrade')
        .argument('[version]', 'The release, such as 4.2.0. The latest by default.')
        .description(
          'Upgrade Hoverboard to a release: merge it into a new branch, resolve the lockfiles and ' +
            'package.json files, install, migrate the config, build and commit. With ' +
            '--migrations-only, only move site.json to the current schemaVersion and run the ' +
            'Firestore data migrations.',
        )
        .option('--migrations-only', 'Only run the config and data migrations of this version.')
        .option('--no-data', 'With --migrations-only, skip the data migrations.')
        .option('--continue', 'Finish an upgrade after resolving its conflicts.')
        .option('--abort', 'Go back to where the upgrade started, and delete its branch.'),
    ),
  ).action(
    run(async (options, [version]) => {
      const upgrade = await import('./commands/upgrade-code.js');
      if (options['continue']) return upgrade.runUpgradeContinue({ yes: options.yes === true });
      if (options['abort']) return upgrade.runUpgradeAbort();
      if (options['migrationsOnly']) {
        return (await import('./commands/upgrade.js')).runUpgrade({
          dryRun: options.dryRun === true,
          yes: options.yes === true,
          data: options['data'] !== false,
        });
      }
      if (options.production) {
        throw new UsageError(
          '--production only applies with --migrations-only. Upgrade the code first, then run ' +
            './hb upgrade --production --migrations-only.',
        );
      }
      return upgrade.runCodeUpgrade({
        ...(version ? { version } : {}),
        dryRun: options.dryRun === true,
        yes: options.yes === true,
      });
    }),
  );

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
