import { documentMessages } from '../lib/content.js';
import { confirm } from '../lib/prompt.js';
import { resolveFirebaseProjectId } from '../utils/firebase-project.js';
import { findRepoRoot } from '../utils/node-version.js';
import { siteFeatures } from '../utils/site-features.js';

export interface NotifyOptions {
  title: string;
  body: string;
  /** The page or link the notification opens. */
  path?: string;
  icon?: string;
  /** Send to production without asking. */
  yes?: boolean;
}

/**
 * Sends a general notification to every device that turned general notifications on, by adding
 * it to `notifications`. The `sendGeneralNotification` function sends it from there. Writes to the
 * emulator unless FIRESTORE_TARGET=production. Returns whether it was added.
 */
export const runNotify = async ({ title, body, path, icon, yes = false }: NotifyOptions) => {
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

  const projectId =
    process.env['FIRESTORE_TARGET'] === 'production'
      ? resolveFirebaseProjectId(repoRoot)
      : undefined;
  if (projectId && !yes) {
    const question = `Send "${notification.title}" to every subscribed device of ${projectId}?`;
    if (!process.stdin.isTTY) {
      console.log(`✘ ${question} Run again with --yes to send it without asking.`);
      return false;
    }
    if (!(await confirm(question))) return false;
  }

  const { firestore } = await import('../lib/firestore.js');
  await firestore.collection('notifications').doc(id).create(notification);
  console.log(
    `✔ Added notifications/${id} to ${projectId ?? 'the emulator'}. ` +
      'The sendGeneralNotification function sends it to every subscribed device.',
  );
  return true;
};
