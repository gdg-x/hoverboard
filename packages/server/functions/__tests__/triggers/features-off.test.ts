import { getFirestore } from 'firebase-admin/firestore';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { isFeatureOff } from '../../src/features';
import { sendGeneralNotification } from '../../src/triggers/notifications';
import { scheduleNotifications } from '../../src/triggers/schedule-notifications';

vi.mock('firebase-admin/firestore');
vi.mock('firebase-functions/logger');
vi.mock('../../src/features', () => ({ isFeatureOff: vi.fn(() => true) }));

const event = {
  data: { data: () => ({ title: 'Title', body: 'Body', email: 'ada@example.com' }) },
  params: {},
} as never;

describe('functions with their feature off', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each([
    ['sendGeneralNotification', () => sendGeneralNotification.run(event), ['notifications']],
    [
      'scheduleNotifications',
      () => scheduleNotifications.run(undefined as never),
      ['notifications'],
    ],
  ])('%s returns without reading Firestore', async (name, run, features) => {
    await run();

    expect(isFeatureOff).toHaveBeenCalledWith(name, ...features);
    expect(getFirestore).not.toHaveBeenCalled();
  });

  it('scheduleNotifications also needs mySchedule', async () => {
    vi.mocked(isFeatureOff).mockImplementation((_name, feature) => feature === 'mySchedule');

    await scheduleNotifications.run(undefined as never);

    expect(isFeatureOff).toHaveBeenCalledWith('scheduleNotifications', 'mySchedule');
    expect(getFirestore).not.toHaveBeenCalled();
  });
});
