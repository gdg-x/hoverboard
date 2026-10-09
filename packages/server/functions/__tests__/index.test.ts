import { initializeApp } from 'firebase-admin/app';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('firebase-admin/app');
vi.mock('../src/triggers/notifications.js', () => ({
  sendGeneralNotification: 'sendGeneralNotification-marker',
}));
vi.mock('../src/triggers/schedule-notifications.js', () => ({
  scheduleNotifications: 'scheduleNotifications-marker',
}));

describe('functions entry point', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('initializes the Firebase app and re-exports every trigger', async () => {
    const indexModule = await import('../src/index');

    expect(initializeApp).toHaveBeenCalledTimes(1);
    expect(indexModule).toStrictEqual(
      expect.objectContaining({
        sendGeneralNotification: 'sendGeneralNotification-marker',
        scheduleNotifications: 'scheduleNotifications-marker',
      }),
    );
    expect(Object.keys(indexModule).sort()).toEqual([
      'scheduleNotifications',
      'sendGeneralNotification',
    ]);
  });
});
