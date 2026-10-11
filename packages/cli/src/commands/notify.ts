import type { CommandResult } from '../lib/command.js';
import { documentMessages } from '../lib/content.js';
import { confirmChange } from '../lib/prompt.js';
import { productionProjectId } from '../lib/target.js';
import { findRepoRoot } from '../utils/node-version.js';
import { siteFeatures } from '../utils/site-features.js';

export interface NotifyOptions {
  title: string;
  body: string;
  /** The page or link the notification opens. */
  path?: string;
  icon?: string;
  /** Check the notification without adding it. */
  dryRun?: boolean;
  /** Send to production without asking. */
  yes?: boolean;
}

/**
 * Sends a general notification to every device that turned general notifications on, by adding
 * it to `notifications`. The `sendGeneralNotification` function sends it from there. Writes to the
 * emulator unless the target is production.
 */
export const runNotify = async ({
  title,
  body,
  path,
  icon,
  dryRun = false,
  yes = false,
}: NotifyOptions): Promise<CommandResult | false> => {
  const repoRoot = findRepoRoot(process.cwd()) ?? process.cwd();
  const features = siteFeatures(repoRoot);
  const off = (['notifications', 'functions'] as const).filter((name) => features[name] === false);
  if (off.length) {
    console.log(`✘ Nothing would send it: features.${off.join(' and features.')} off.`);
    return false;
  }

  const notification = {
    title: title.trim(),
    body: body.trim(),
    ...(path ? { path } : {}),
    ...(icon ? { icon } : {}),
  };
  const id = String(Date.now());
  const problems = [
    ...(notification.title ? [] : ['The title is empty.']),
    ...(notification.body ? [] : ['The body is empty.']),
    ...documentMessages(`notifications/${id}`, notification),
  ];
  if (problems.length) {
    for (const problem of problems) console.log(`✘ ${problem}`);
    return false;
  }

  const projectId = productionProjectId(repoRoot);
  const target = projectId ?? 'the emulator';
  if (dryRun) {
    console.log(
      `✔ notifications/${id} is valid. Dry run: it wasn't added to ${target}, so nothing was sent.`,
    );
    return { ok: true, path: `notifications/${id}`, dryRun };
  }
  if (
    projectId &&
    !(await confirmChange(
      `Send "${notification.title}" to every subscribed device of ${projectId}?`,
      yes,
    ))
  ) {
    return false;
  }

  const { firestore } = await import('../lib/firestore.js');
  await firestore.collection('notifications').doc(id).create(notification);
  console.log(
    `✔ Added notifications/${id} to ${target}. ` +
      'The sendGeneralNotification function sends it to every subscribed device.',
  );
  return { ok: true, path: `notifications/${id}`, dryRun };
};
