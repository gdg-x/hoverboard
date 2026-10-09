import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { createGoogleCloud, type GoogleCloud } from '../lib/google-cloud.js';
import type { DoctorCheckResult } from './node-version.js';
import { siteFeatures } from './site-features.js';

const name = 'Browser API key';
const API_KEYS = 'https://apikeys.googleapis.com/v2';
const MAPS_API = 'maps-backend.googleapis.com';
// The APIs the site's Firebase SDKs call with the key, from Firebase's list of APIs a key needs:
// https://firebase.google.com/docs/projects/api-keys#faq-required-apis-for-restricted-firebase-api-key
const FIREBASE_APIS = [
  'firebase.googleapis.com',
  'logging.googleapis.com',
  'identitytoolkit.googleapis.com',
  'securetoken.googleapis.com',
  'firestore.googleapis.com',
  'datastore.googleapis.com',
  'firebaseinstallations.googleapis.com',
  'fcmregistrations.googleapis.com',
  'firebaseremoteconfig.googleapis.com',
  'firebaseremoteconfigrealtime.googleapis.com',
  'firebaselogging.googleapis.com',
];
// Hosts no site's key should allow, to catch a pattern such as `*` or `*.web.app`.
const FOREIGN_HOSTS = ['attacker.example', 'attacker.web.app', 'attacker.firebaseapp.com'];

interface ApiKey {
  name: string;
  restrictions?: {
    browserKeyRestrictions?: { allowedReferrers?: string[] };
    apiTargets?: { service: string }[];
  };
}

interface SiteJson {
  url?: string;
  integrations?: { googleMapsApiKey?: string };
}

const readSite = (repoRoot: string): SiteJson => {
  const path = join(repoRoot, 'packages', 'config', 'site.json');
  return existsSync(path) ? (JSON.parse(readFileSync(path, 'utf8')) as SiteJson) : {};
};

/** Whether a website restriction, such as `*.example.com/*` or `https://example.com`, allows `host`. */
export const referrerAllows = (pattern: string, host: string): boolean => {
  const hostPattern = pattern.replace(/^[a-z*]+:\/\//i, '').split(/[/:]/)[0] ?? '';
  const regex = hostPattern
    .split('*')
    .map((part) => part.replace(/[.+?^${}()|[\]\\]/g, '\\$&'))
    .join('.*');
  return new RegExp(`^${regex}$`, 'i').test(host);
};

/** Problems with a key's restrictions, for the hosts it must work on and the APIs the site calls with it. */
export const keyProblems = (
  key: ApiKey,
  label: string,
  {
    hosts,
    firebase = false,
    maps = false,
  }: { hosts: string[]; firebase?: boolean; maps?: boolean },
): string[] => {
  const referrers = key.restrictions?.browserKeyRestrictions?.allowedReferrers ?? [];
  const services = key.restrictions?.apiTargets?.map(({ service }) => service) ?? [];
  const problems: string[] = [];
  if (!referrers.length) {
    problems.push(`${label} works from any website. Restrict it to ${hosts.join(', ')}.`);
  } else {
    const missing = hosts.filter((host) => !referrers.some((p) => referrerAllows(p, host)));
    if (missing.length) problems.push(`${label} doesn't allow ${missing.join(', ')}.`);
    const broad = referrers.filter((p) => FOREIGN_HOSTS.some((host) => referrerAllows(p, host)));
    if (broad.length) problems.push(`${label} allows other people's sites: ${broad.join(', ')}.`);
  }
  if (!services.length) {
    problems.push(
      `${label} can call every API the project has on. Limit it to the APIs the site uses.`,
    );
  } else {
    if (maps && !services.includes(MAPS_API)) {
      problems.push(`${label} can't call ${MAPS_API}, which the map needs.`);
    }
    const allowed = [...(firebase ? FIREBASE_APIS : []), ...(maps ? [MAPS_API] : [])];
    const extra = services.filter((service) => !allowed.includes(service));
    if (extra.length) {
      problems.push(`${label} can call APIs the site doesn't use: ${extra.join(', ')}.`);
    }
  }
  return problems;
};

const apiDisabled = (error: unknown) =>
  /API Keys API has not been used|SERVICE_DISABLED/i.test(
    error instanceof Error ? error.message : String(error),
  );

// Key names use the project number or ID, so compare their IDs.
const keyId = (keyName: string | undefined) => keyName?.split('/').pop();

const withConsoleLink = (problems: string[], keyName: string, project: string) =>
  problems.length
    ? [
        ...problems,
        `Edit it at https://console.cloud.google.com/apis/credentials/key/${keyId(keyName)}?project=${project}.`,
      ]
    : [];

const webAppKeyIds = async (cloud: GoogleCloud, projectId: string): Promise<string[]> => {
  const { apps = [] } = await cloud.request<{ apps?: { apiKeyId?: string }[] }>(
    'GET',
    `https://firebase.googleapis.com/v1beta1/projects/${projectId}/webApps`,
  );
  return [...new Set(apps.flatMap(({ apiKeyId }) => (apiKeyId ? [apiKeyId] : [])))];
};

/**
 * Warns when the browser API key of the project's web app, or the Google Maps key in site.json,
 * works from any website, misses one of the site's hosts, or can call APIs the site doesn't use.
 */
export const checkApiKeys = async (
  repoRoot: string | undefined,
  projectId: string | undefined,
  { createCloud = createGoogleCloud } = {},
): Promise<DoctorCheckResult> => {
  if (!repoRoot || !projectId) {
    return { name, ok: true, warning: true, message: 'Skipped, no Firebase project.' };
  }

  const site = readSite(repoRoot);
  const siteHost = new URL(site.url ?? `https://${projectId}.web.app/`).hostname;
  // Firebase Auth's sign-in pages are on the auth domain.
  const hosts = [...new Set([siteHost, `${projectId}.firebaseapp.com`])];
  const mapsKey =
    siteFeatures(repoRoot)['map'] !== false ? site.integrations?.googleMapsApiKey : undefined;

  const problems: string[] = [];
  try {
    const cloud = await createCloud(repoRoot, projectId);
    const ids = await webAppKeyIds(cloud, projectId);
    if (!ids.length) {
      return {
        name,
        ok: true,
        warning: true,
        message: `${projectId} has no web app with an API key.`,
      };
    }
    const webKeys = await Promise.all(
      ids.map((id) =>
        cloud.request<ApiKey>(
          'GET',
          `${API_KEYS}/projects/${projectId}/locations/global/keys/${id}`,
        ),
      ),
    );
    const mapsKeyName = mapsKey
      ? (
          await cloud.request<{ name: string }>(
            'GET',
            `${API_KEYS}/keys:lookupKey?keyString=${encodeURIComponent(mapsKey)}`,
          )
        ).name
      : undefined;
    for (const key of webKeys) {
      const usedForMaps = keyId(key.name) === keyId(mapsKeyName);
      const label = usedForMaps ? 'The browser key, also the Maps key,' : 'The browser key';
      problems.push(
        ...withConsoleLink(
          keyProblems(key, label, { hosts, firebase: true, maps: usedForMaps }),
          key.name,
          projectId,
        ),
      );
    }
    if (mapsKeyName && !webKeys.some((key) => keyId(key.name) === keyId(mapsKeyName))) {
      try {
        const key = await cloud.request<ApiKey>('GET', `${API_KEYS}/${mapsKeyName}`);
        problems.push(
          ...withConsoleLink(
            keyProblems(key, 'The Maps key', { hosts: [siteHost], maps: true }),
            key.name,
            // The Maps key may be in another project, named by its number.
            key.name.split('/')[1] ?? projectId,
          ),
        );
      } catch {
        problems.push("Can't read the Maps key in site.json, which may belong to another project.");
      }
    }
  } catch (error) {
    const reason = apiDisabled(error)
      ? `the API Keys API is off. Turn it on at https://console.cloud.google.com/apis/library/apikeys.googleapis.com?project=${projectId}, then run \`./hb doctor\` again.`
      : error instanceof Error
        ? error.message
        : String(error);
    return {
      name,
      ok: true,
      warning: true,
      message: `Could not check the API keys of ${projectId}: ${reason}`,
    };
  }

  if (!problems.length) {
    return {
      name,
      ok: true,
      message: `Restricted to ${hosts.join(', ')} and to the APIs the site uses.`,
    };
  }
  return {
    name,
    ok: true,
    warning: true,
    message: problems.join(' '),
  };
};
