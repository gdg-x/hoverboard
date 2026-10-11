import { afterEach, describe, expect, it, vi } from 'vitest';
import { html, render } from 'lit';
import { deepQuerySelector, screen } from 'shadow-dom-testing-library';
import { fixture } from '../../../__tests__/helpers/fixtures';
import { setFeatures } from '../../../__tests__/helpers/features';
import { setStoreState } from '../../../__tests__/helpers/store';
import { SYNCING_DELAY_MS, type SyncStatus } from './sync-status';
import './sync-status';

describe('sync-status', () => {
  it('shows nothing while online with everything synced', async () => {
    render(html`<sync-status></sync-status>`, document.body);
    const element = deepQuerySelector<SyncStatus>(document.body, 'sync-status')!;
    await element.updateComplete;

    expect(deepQuerySelector(element, 'hb-popover')).toBeNull();
  });

  it('shows only an icon while offline with nothing to sync', async () => {
    setStoreState({ sync: { online: false, pending: {} } });
    const { shadowRoot } = await fixture(html`<sync-status></sync-status>`);
    const status = screen.getByShadowRole('button');

    expect(status).toHaveTextContent(/^Offline$/);
    expect(deepQuerySelector(status, '[aria-hidden]')).toBeNull();
    expect(deepQuerySelector(shadowRoot, 'hoverboard-icon')).toHaveAttribute('name', 'cloud-off');
  });

  it('shows the number of changes to sync, with what works offline', async () => {
    setStoreState({ sync: { online: false, pending: { featuredSessions: ['a', 'b'] } } });
    const { shadowRoot } = await fixture(html`<sync-status></sync-status>`);
    const status = screen.getByShadowRole('button');

    expect(deepQuerySelector(status, '[aria-hidden="true"]')).toHaveTextContent(/^2$/);
    expect(deepQuerySelector(shadowRoot, 'hoverboard-icon')).toHaveAttribute(
      'name',
      'cloud-upload',
    );
    expect(deepQuerySelector(status, '.visually-hidden')).toHaveTextContent(
      'Offline · 2 changes to sync',
    );
    expect(status).toHaveAttribute('title', 'Offline · 2 changes to sync');
    expect(status).toHaveAttribute('aria-live', 'polite');
    expect(status).toHaveAttribute('slot', 'trigger');
    expect(deepQuerySelector(shadowRoot, 'hb-popover .help')).toHaveTextContent(
      /^Saved sessions, feedback, reminders, reactions and your profile are kept on this device, and sync when you are online/,
    );
  });

  it('leaves reactions out of what works offline when they are off', async () => {
    setFeatures({ reactions: false });
    setStoreState({ sync: { online: false, pending: {} } });
    const { shadowRoot } = await fixture(html`<sync-status></sync-status>`);

    expect(deepQuerySelector(shadowRoot, 'hb-popover .help')).toHaveTextContent(
      /^Saved sessions, feedback and reminders are kept on this device, and sync when you are online/,
    );
  });

  it('counts unsynced reactions and profiles with the other changes', async () => {
    setStoreState({
      sync: {
        online: false,
        pending: { featuredSessions: ['a'], reactions: ['101', '102'], profiles: ['ada'] },
      },
    });
    await fixture(html`<sync-status></sync-status>`);

    expect(screen.getByShadowRole('button')).toHaveAttribute(
      'title',
      'Offline · 4 changes to sync',
    );
  });

  describe('online', () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it('says it syncs only when a change takes a while', async () => {
      vi.useFakeTimers();
      setStoreState({ sync: { online: true, pending: { feedback: ['a'] } } });
      const { element, shadowRoot } = await fixture<SyncStatus>(html`<sync-status></sync-status>`);

      expect(deepQuerySelector(shadowRoot, 'hb-popover')).toBeNull();

      vi.advanceTimersByTime(SYNCING_DELAY_MS);
      await element.updateComplete;
      const status = screen.getByShadowRole('button');

      expect(deepQuerySelector(status, '[aria-hidden="true"]')).toHaveTextContent(/^1$/);
      expect(deepQuerySelector(status, '.visually-hidden')).toHaveTextContent('Syncing…');
    });

    it('shows nothing for a change that syncs quickly', async () => {
      vi.useFakeTimers();
      setStoreState({ sync: { online: true, pending: { reactions: ['101'] } } });
      const { element, shadowRoot } = await fixture<SyncStatus>(html`<sync-status></sync-status>`);

      vi.advanceTimersByTime(SYNCING_DELAY_MS - 1);
      setStoreState({ sync: { online: true, pending: { reactions: [] } } });
      await element.updateComplete;
      vi.advanceTimersByTime(SYNCING_DELAY_MS);
      await element.updateComplete;

      expect(deepQuerySelector(shadowRoot, 'hb-popover')).toBeNull();
    });

    it('says it syncs at once when it comes back online with changes', async () => {
      setStoreState({ sync: { online: false, pending: { featuredSessions: ['a'] } } });
      const { element } = await fixture<SyncStatus>(html`<sync-status></sync-status>`);

      setStoreState({ sync: { online: true, pending: { featuredSessions: ['a'] } } });
      await element.updateComplete;

      expect(
        deepQuerySelector(screen.getByShadowRole('button'), '.visually-hidden'),
      ).toHaveTextContent('Syncing…');
    });
  });
});
