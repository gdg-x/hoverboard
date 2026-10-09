import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

interface HeaderRule {
  source: string;
  headers: Array<{ key: string; value: string }>;
}

const { hosting } = JSON.parse(
  readFileSync(join(import.meta.dirname, '../../firebase.json'), 'utf8'),
) as { hosting: { headers: HeaderRule[] } };

const headersFor = (source: string) =>
  Object.fromEntries(
    hosting.headers
      .find((rule) => rule.source === source)!
      .headers.map(({ key, value }) => [key, value]),
  );

describe('Firebase Hosting headers', () => {
  it('sets the security headers on every response', () => {
    expect(headersFor('**')).toEqual({
      // Hosting sets its own on web.app, so this applies to custom domains. Subdomains of an
      // organizer's domain may not be ours to force onto HTTPS.
      'Strict-Transport-Security': 'max-age=31536000',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN',
      // Referrer-restricted API keys, such as the Maps key, need the origin on cross-origin requests.
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy':
        'camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()',
      // Google sign-in uses signInWithPopup.
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
    });
  });

  it('does not set deprecated headers', () => {
    const keys = hosting.headers.flatMap((rule) => rule.headers.map(({ key }) => key));

    expect(keys).not.toContain('X-XSS-Protection');
  });
});
