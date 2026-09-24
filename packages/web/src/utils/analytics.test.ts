import { logEvent } from 'firebase/analytics';
import { describe, expect, it, vi } from 'vitest';
import { logLogin, logPageView } from './analytics';

vi.mock('firebase/analytics');
vi.mock('../firebase', () => ({ analytics: 'mock-analytics-instance' }));

describe('logPageView', () => {
  it('logs a page_view event', () => {
    logPageView();

    expect(logEvent).toHaveBeenCalledWith('mock-analytics-instance', 'page_view');
  });
});

describe('logLogin', () => {
  it('logs a login event', () => {
    logLogin();

    expect(logEvent).toHaveBeenCalledWith('mock-analytics-instance', 'login');
  });
});
