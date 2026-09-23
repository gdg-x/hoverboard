import { describe, expect, it } from 'vitest';
import { store } from '.';

describe('store', () => {
  it('combines every slice under its own state key with its initial state', () => {
    const state = store.getState();

    expect(Object.keys(state).sort()).toStrictEqual(
      [
        'auth',
        'blog',
        'dialogs',
        'featuredSessions',
        'feedback',
        'filters',
        'gallery',
        'members',
        'notificationPermission',
        'notificationsSubscribers',
        'notificationsUsers',
        'partners',
        'potentialPartners',
        'previousSpeakers',
        'schedule',
        'sessions',
        'snackbars',
        'speakers',
        'subscribed',
        'teams',
        'tickets',
        'ui',
        'updateNotificationsSubscribers',
        'updateNotificationsUsers',
        'user',
        'videos',
      ].sort(),
    );
  });

  it('wires dispatch/getState so slices can use them without a circular import', async () => {
    const { dispatch, getState } = await import('./dispatch');

    expect(getState()).toBe(store.getState());
    expect(() => dispatch({ type: '@@NOOP' })).not.toThrow();
  });
});
