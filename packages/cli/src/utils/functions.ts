import { listDeployedFunctions } from '../lib/deployed-functions.js';
import type { DoctorCheckResult } from './node-version.js';

const name = 'Cloud Functions';

/** The functions that packages/server/functions exports. Every one always deploys. */
export const EXPECTED_FUNCTIONS = [
  'mailchimpSubscribe',
  'optimizeImages',
  'scheduleNotifications',
  'sendGeneralNotification',
];

const list = (names: string[]) => names.join(', ');
const is = (names: unknown[]) => (names.length === 1 ? 'is' : 'are');
const them = (names: unknown[]) => (names.length === 1 ? 'it' : 'them');

/**
 * Checks that the project has every Hoverboard function, deployed as 2nd gen. A 1st gen function
 * fails, because a deploy can't upgrade it in place. Missing and old functions only warn, since
 * the next deploy adds or deletes them.
 */
export const checkFunctions = async (
  repoRoot: string | undefined,
  projectId: string | undefined,
): Promise<DoctorCheckResult> => {
  if (!repoRoot || !projectId) {
    return { name, ok: true, warning: true, message: 'Skipped, no Firebase project.' };
  }

  let deployed;
  try {
    deployed = await listDeployedFunctions(repoRoot, projectId);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    return {
      name,
      ok: true,
      warning: true,
      message: `Could not list the functions of ${projectId}: ${reason}`,
    };
  }

  const expected = new Set(EXPECTED_FUNCTIONS);
  const notGen2 = deployed.filter(({ id, platform }) => expected.has(id) && platform !== 'gcfv2');
  const missing = EXPECTED_FUNCTIONS.filter((id) => !deployed.some((fn) => fn.id === id));
  const extra = deployed.filter(({ id }) => !expected.has(id)).map(({ id }) => id);

  const problems = [
    ...(notGen2.length
      ? [
          `${list(notGen2.map(({ id }) => id))} ${is(notGen2)} 1st gen, which a deploy can't ` +
            `upgrade to 2nd gen. Delete ${them(notGen2)} with ` +
            notGen2
              .map(({ id, region }) => `\`npx firebase functions:delete ${id} --region ${region}\``)
              .join(', ') +
            ', then run `./hbd deploy`.',
        ]
      : []),
    ...(missing.length
      ? [`${list(missing)} ${is(missing)} not deployed. Run \`./hbd deploy\`.`]
      : []),
    ...(extra.length
      ? [
          `${list(extra)} ${is(extra)} no longer in the code. ` +
            `The next deploy deletes ${them(extra)}.`,
        ]
      : []),
  ];

  if (!problems.length) {
    return {
      name,
      ok: true,
      message: `All ${EXPECTED_FUNCTIONS.length} functions are deployed as 2nd gen.`,
    };
  }
  return {
    name,
    ok: notGen2.length === 0,
    ...(notGen2.length ? {} : { warning: true }),
    message: problems.join(' '),
  };
};
