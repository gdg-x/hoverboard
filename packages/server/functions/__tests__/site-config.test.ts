import * as logger from 'firebase-functions/logger';
import { readFileSync } from 'fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('firebase-functions/logger');
vi.mock('fs', async (importOriginal) => ({
  ...(await importOriginal<typeof import('fs')>()),
  readFileSync: vi.fn(),
}));

const loadWith = async (content: string | Error) => {
  vi.resetModules();
  vi.mocked(readFileSync).mockImplementation(() => {
    if (content instanceof Error) throw content;
    return content;
  });
  return import('../src/site-config');
};

describe('getSiteConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('reads the event time zone that the build copied from site.json', async () => {
    const { getSiteConfig } = await loadWith(
      JSON.stringify({ features: {}, timeZone: 'Europe/Kyiv' }),
    );

    expect(getSiteConfig().timeZone).toBe('Europe/Kyiv');
  });

  it('falls back to UTC with a warning when site-config.json is missing', async () => {
    const { getSiteConfig } = await loadWith(new Error('ENOENT'));

    expect(getSiteConfig()).toEqual({ features: {}, timeZone: 'UTC' });
    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('site-config.json'));
  });
});
