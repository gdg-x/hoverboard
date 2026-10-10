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

    expect(element.shadowRoot?.querySelector('details')).toBeNull();
  });

  it('says when the site is offline, with the changes to sync and what works offline', async () => {
    setStoreState({ sync: { online: false, pending: { featuredSessions: ['a', 'b'] } } });
    const { shadowRootForWithin } = await fixture(html`<sync-status></sync-status>`);
    const view = within(shadowRootForWithin);

    expect(view.getByRole('status')).toHaveTextContent('Offline · 2 changes to sync');
    expect(
      view.getByText(/saved on this device, and sync when you are online/),
    ).toBeInTheDocument();
  });

  it('says when it syncs changes made offline', async () => {
    setStoreState({ sync: { online: true, pending: { feedback: ['a'] } } });
    const { shadowRootForWithin } = await fixture(html`<sync-status></sync-status>`);

    expect(within(shadowRootForWithin).getByRole('status')).toHaveTextContent('Syncing…');
  });
});
