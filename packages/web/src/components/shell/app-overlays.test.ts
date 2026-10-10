import { waitFor } from '@testing-library/dom';
import { html, render } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { store } from '../../store';
import { closeDialog, openProfileDialog, openSigninDialog } from '../../store/dialogs';
import type { AppOverlays } from './app-overlays';
import './app-overlays';

const renderOverlays = async () => {
  render(html`<app-overlays></app-overlays>`, document.body);
  const element = document.body.querySelector<AppOverlays>('app-overlays')!;
  await element.updateComplete;
  return element.shadowRoot!;
};

describe('app-overlays', () => {
  afterEach(() => closeDialog());

  it('loads no overlay until the store needs one', async () => {
    await renderOverlays();

    expect(customElements.get('signin-dialog')).toBeUndefined();
    expect(store.getState().snackbars).toHaveLength(0);
  });

  it('loads and renders the sign-in dialog when it opens', async () => {
    const shadowRoot = await renderOverlays();

    openSigninDialog();

    await waitFor(() => expect(shadowRoot.querySelector('signin-dialog')).not.toBeNull());
    expect(customElements.get('signin-dialog')).toBeDefined();
  });

  it('loads and renders the profile dialog when it opens', async () => {
    const shadowRoot = await renderOverlays();

    openProfileDialog();

    await waitFor(() => expect(shadowRoot.querySelector('profile-dialog')).not.toBeNull());
  });
});
