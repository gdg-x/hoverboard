import { initializeApp } from 'firebase-admin/app';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('firebase-admin/app');
vi.mock('../src/triggers/generate-sessions-speakers-schedule.js', () => ({
  scheduleWrite: 'scheduleWrite-marker',
  sessionsWrite: 'sessionsWrite-marker',
  speakersWrite: 'speakersWrite-marker',
}));
vi.mock('../src/triggers/mailchimp-subscribe.js', () => ({
  mailchimpSubscribe: 'mailchimpSubscribe-marker',
}));
vi.mock('../src/triggers/notifications.js', () => ({
  sendGeneralNotification: 'sendGeneralNotification-marker',
}));
vi.mock('../src/triggers/optimize-images.js', () => ({
  optimizeImages: 'optimizeImages-marker',
}));
vi.mock('../src/triggers/prerender.js', () => ({
  prerender: 'prerender-marker',
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
    expect(indexModule).toMatchObject({
      sendGeneralNotification: 'sendGeneralNotification-marker',
      scheduleNotifications: 'scheduleNotifications-marker',
      optimizeImages: 'optimizeImages-marker',
      mailchimpSubscribe: 'mailchimpSubscribe-marker',
      prerender: 'prerender-marker',
      scheduleWrite: 'scheduleWrite-marker',
      sessionsWrite: 'sessionsWrite-marker',
      speakersWrite: 'speakersWrite-marker',
    });
  });
});
