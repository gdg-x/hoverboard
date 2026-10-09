import * as logger from 'firebase-functions/logger';
import { readFileSync } from 'fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('firebase-functions/logger');
vi.mock('fs', async (importOriginal) => ({
  ...(await importOriginal<typeof import('fs')>()),
  readFileSync: vi.fn(),
}));

const loadWith = async (features: Record<string, boolean> | Error) => {
  vi.resetModules();
  vi.mocked(readFileSync).mockImplementation(() => {
    if (features instanceof Error) throw features;
    return JSON.stringify({ features, timeZone: 'UTC' });
  });
  return import('../src/features');
};

describe('isFeatureOff', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lets the function run when its feature is on', async () => {
    const { isFeatureOff } = await loadWith({ notifications: true });

    expect(isFeatureOff('sendGeneralNotification', 'notifications')).toBe(false);
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('logs an error that names the site.json key when the feature is off', async () => {
    const { isFeatureOff } = await loadWith({ notifications: false });

    expect(isFeatureOff('sendGeneralNotification', 'notifications')).toBe(true);
    expect(logger.error).toHaveBeenCalledWith(
      'sendGeneralNotification did nothing because features.notifications is false in packages/config/site.json.',
    );
  });

  it('runs while any of several features is on', async () => {
    const { isFeatureOff } = await loadWith({ notifications: false, mySchedule: true });

    expect(isFeatureOff('reminders', 'notifications', 'mySchedule')).toBe(false);
  });

  it('stops when all of several features are off', async () => {
    const { isFeatureOff } = await loadWith({ notifications: false, mySchedule: false });

    expect(isFeatureOff('reminders', 'notifications', 'mySchedule')).toBe(true);
    expect(logger.error).toHaveBeenCalledWith(
      'reminders did nothing because features.notifications and features.mySchedule are false in packages/config/site.json.',
    );
  });

  it('treats every feature as on when site-config.json is missing', async () => {
    const { isFeatureOff } = await loadWith(new Error('ENOENT'));

    expect(isFeatureOff('sendGeneralNotification', 'notifications')).toBe(false);
    expect(logger.warn).toHaveBeenCalledTimes(1);
  });

  it('reads site-config.json once', async () => {
    const { isFeatureOff } = await loadWith({});

    isFeatureOff('scheduleNotifications', 'mySchedule');
    isFeatureOff('sendGeneralNotification', 'notifications');

    expect(readFileSync).toHaveBeenCalledTimes(1);
  });
});
