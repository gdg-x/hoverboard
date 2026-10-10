import { afterEach, describe, expect, it, vi } from 'vitest';
import { html, render } from 'lit';
import { within } from '@testing-library/dom';
import { fixture } from '../../../__tests__/helpers/fixtures';
import { setFeatures } from '../../../__tests__/helpers/features';
import { setStoreState } from '../../../__tests__/helpers/store';
import { SYNCING_DELAY_MS, type SyncStatus } from './sync-status';
import './sync-status';

describe('sync-status', () => {
  it('shows nothing while online with everything synced', async () => {
    render(html`<sync-status></sync-status>`, document.body);
    const element = document.querySelector('sync-status')!;
    await element.updateComplete;

    expect(element.shadowRoot?.querySelector('hb-popover')).toBeNull();
  });

  it('shows only an icon while offline with nothing to sync', async () => {
    setStoreState({ sync: { online: false, pending: {} } });
    const { shadowRoot, shadowRootForWithin } = await fixture(html`<sync-status></sync-status>`);
    const status = within(shadowRootForWithin).getByRole('button');

    expect(status).toHaveTextContent(/^Offline$/);
    expect(status.querySelector('[aria-hidden]')).toBeNull();
    expect(shadowRoot.querySelector('hoverboard-icon')).toHaveAttribute('name', 'cloud-off');
  });

  it('shows the number of changes to sync, with what works offline', async () => {
    setStoreState({ sync: { online: false, pending: { featuredSessions: ['a', 'b'] } } });
    const { shadowRoot, shadowRootForWithin } = await fixture(html`<sync-status></sync-status>`);
    const view = within(shadowRootForWithin);
    const status = view.getByRole('button');

    expect(status.querySelector('[aria-hidden="true"]')).toHaveTextContent(/^2$/);
    expect(shadowRoot.querySelector('hoverboard-icon')).toHaveAttribute('name', 'cloud-upload');
    expect(status.querySelector('.visually-hidden')).toHaveTextContent(
      'Offline · 2 changes to sync',
    );
    expect(status).toHaveAttribute('title', 'Offline · 2 changes to sync');
    expect(status).toHaveAttribute('aria-live', 'polite');
    expect(status).toHaveAttribute('slot', 'trigger');
    expect(shadowRoot.querySelector('hb-popover .help')).toHaveTextContent(
      /^Saved sessions, feedback, reminders, reactions and your profile are kept on this device, and sync when you are online/,
    );
  });

  it('leaves reactions out of what works offline when they are off', async () => {
    setFeatures({ reactions: false });
    setStoreState({ sync: { online: false, pending: {} } });
    const { shadowRoot } = await fixture(html`<sync-status></sync-status>`);

    expect(shadowRoot.querySelector('hb-popover .help')).toHaveTextContent(
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
    const { shadowRootForWithin } = await fixture(html`<sync-status></sync-status>`);

    expect(within(shadowRootForWithin).getByRole('button')).toHaveAttribute(
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
      const { element, shadowRoot, shadowRootForWithin } = await fixture<SyncStatus>(
        html`<sync-status></sync-status>`,
      );

      expect(shadowRoot.querySelector('hb-popover')).toBeNull();

      vi.advanceTimersByTime(SYNCING_DELAY_MS);
      await element.updateComplete;
      const status = within(shadowRootForWithin).getByRole('button');

      expect(status.querySelector('[aria-hidden="true"]')).toHaveTextContent(/^1$/);
      expect(status.querySelector('.visually-hidden')).toHaveTextContent('Syncing…');
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

      expect(shadowRoot.querySelector('hb-popover')).toBeNull();
    });

    it('says it syncs at once when it comes back online with changes', async () => {
      setStoreState({ sync: { online: false, pending: { featuredSessions: ['a'] } } });
      const { element, shadowRootForWithin } = await fixture<SyncStatus>(
        html`<sync-status></sync-status>`,
      );

      setStoreState({ sync: { online: true, pending: { featuredSessions: ['a'] } } });
      await element.updateComplete;

      expect(
        within(shadowRootForWithin).getByRole('button').querySelector('.visually-hidden'),
      ).toHaveTextContent('Syncing…');
    });
  });
});
