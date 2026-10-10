import { describe, expect, it } from 'vitest';
import { html, render } from 'lit';
import { within } from '@testing-library/dom';
import { fixture } from '../../../__tests__/helpers/fixtures';
import { setStoreState } from '../../../__tests__/helpers/store';
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
      /^Saved sessions, feedback and reminders are kept on this device, and sync when you are online/,
    );
  });

  it('says when it syncs changes made offline', async () => {
    setStoreState({ sync: { online: true, pending: { feedback: ['a'] } } });
    const { shadowRootForWithin } = await fixture(html`<sync-status></sync-status>`);
    const status = within(shadowRootForWithin).getByRole('button');

    expect(status.querySelector('[aria-hidden="true"]')).toHaveTextContent(/^1$/);
    expect(status.querySelector('.visually-hidden')).toHaveTextContent('Syncing…');
  });
});
