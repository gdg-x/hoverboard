import { createGoogleCloud, type GoogleCloud } from '../lib/google-cloud.js';
import { confirmChange } from '../lib/prompt.js';
import { UsageError } from '../lib/command.js';
import { demoDeployProblem, resolveFirebaseProjectId } from '../utils/firebase-project.js';
import { findRepoRoot } from '../utils/node-version.js';
import { type Policy, addMember, removeMember } from './setup-github.js';

const CRM = 'https://cloudresourcemanager.googleapis.com/v1';

/**
 * What a content editor needs: reading and writing Firestore documents, and opening the project in
 * the Firebase console. Neither role covers billing, Cloud Functions, Hosting or security rules.
 */
export const EDITOR_ROLES = ['roles/datastore.user', 'roles/firebase.viewer'] as const;

const EMAIL = /^[^@\s]+@[^@\s]+$/;

interface EditorOptions {
  dryRun?: boolean;
  yes?: boolean;
  cloud?: GoogleCloud;
}

const project = async (cloud?: GoogleCloud) => {
  const repoRoot = findRepoRoot(process.cwd());
  const demo = repoRoot && demoDeployProblem(repoRoot);
  if (demo) throw new UsageError(demo);
  const projectId = repoRoot && resolveFirebaseProjectId(repoRoot);
  if (!repoRoot || !projectId) {
    throw new UsageError(
      'No Firebase project. Set firebase.projectId in packages/config/site.json.',
    );
  }
  return { projectId, cloud: cloud ?? (await createGoogleCloud(repoRoot, projectId)) };
};

const getPolicy = (cloud: GoogleCloud, projectId: string) =>
  cloud.request<Policy>('POST', `${CRM}/projects/${projectId}:getIamPolicy`, {
    options: { requestedPolicyVersion: 3 },
  });

/** The people who have every editor role, by email. */
export const editors = (policy: Policy): string[] => {
  const members = EDITOR_ROLES.map(
    (role) =>
      new Set(
        policy.bindings?.find((binding) => binding.role === role && !binding.condition)?.members,
      ),
  );
  return [...members[0]!]
    .filter((member) => member.startsWith('user:') && members.every((set) => set.has(member)))
    .map((member) => member.slice('user:'.length))
    .sort();
};

export const runEditorList = async (options: Pick<EditorOptions, 'cloud'> = {}) => {
  const { projectId, cloud } = await project(options.cloud);
  const list = editors(await getPolicy(cloud, projectId));
  console.log(
    list.length
      ? `Content editors of ${projectId}:\n${list.map((email) => `  ${email}`).join('\n')}`
      : `${projectId} has no content editors. Add one with ./hb editor add <email>.`,
  );
  return { ok: true, editors: list };
};

const change = async (
  action: 'add' | 'remove',
  email: string,
  { dryRun = false, yes = false, cloud: given }: EditorOptions,
): Promise<boolean> => {
  if (!EMAIL.test(email)) throw new UsageError(`"${email}" is not an email address.`);
  const { projectId, cloud } = await project(given);
  const policy = await getPolicy(cloud, projectId);
  const member = `user:${email}`;
  const changed = EDITOR_ROLES.filter((role) =>
    action === 'add' ? addMember(policy, role, member) : removeMember(policy, role, member),
  );
  if (!changed.length) {
    console.log(
      `✔ ${email} ${action === 'add' ? 'already is' : "isn't"} a content editor of ${projectId}.`,
    );
    return true;
  }
  const what = `${action === 'add' ? 'Grant' : 'Remove'} ${changed.join(' and ')} ${action === 'add' ? 'to' : 'from'} ${email} in ${projectId}`;
  if (dryRun) {
    console.log(`Dry run: would ${what.charAt(0).toLowerCase()}${what.slice(1)}.`);
    return true;
  }
  if (!(await confirmChange(`${what}?`, yes))) {
    console.log('Aborted.');
    return false;
  }
  await cloud.request('POST', `${CRM}/projects/${projectId}:setIamPolicy`, { policy });
  console.log(
    action === 'add'
      ? `✔ ${email} can edit the content in the Firebase console: ` +
          `https://console.firebase.google.com/project/${projectId}/firestore. ` +
          'It can take a few minutes to work.'
      : `✔ ${email} can no longer edit the content.`,
  );
  return true;
};

/** Lets `email` edit the content in the Firebase console, without billing, functions or deploys. */
export const runEditorAdd = (email: string, options: EditorOptions = {}) =>
  change('add', email, options);

export const runEditorRemove = (email: string, options: EditorOptions = {}) =>
  change('remove', email, options);
