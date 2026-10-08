import { Success } from '@abraham/remotedata';
import { fireEvent, within } from '@testing-library/dom';
import { html } from 'lit';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fixture } from '../../../__tests__/helpers/fixtures';
import { setStoreState } from '../../../__tests__/helpers/store';
import type { Ticket } from '../../models/ticket';
import type { AppHeader } from './app-header';
import type { HeaderToolbar } from './header-toolbar';
import './app-header';

const toolbar = (shadowRoot: ShadowRoot) =>
  shadowRoot.querySelector<HeaderToolbar>('header-toolbar')!;

describe('app-header', () => {
  afterEach(() => vi.restoreAllMocks());

  it("selects the drawer link of the page's path and passes the path to the toolbar", async () => {
    const { shadowRoot, shadowRootForWithin } = await fixture<AppHeader>(
      html`<app-header path="/sessions/101"></app-header>`,
    );

    expect(within(shadowRootForWithin).getByRole('link', { name: 'Schedule' })).toHaveClass(
      'selected',
    );
    expect(toolbar(shadowRoot).path).toBe('/sessions/101');
  });

  it('opens the drawer from the toolbar and closes it from the scrim', async () => {
    const { element, shadowRoot } = await fixture<AppHeader>(html`<app-header></app-header>`);
    const drawer = shadowRoot.querySelector('.drawer');

    toolbar(shadowRoot).dispatchEvent(
      new CustomEvent('drawer-opened-changed', { detail: { value: true } }),
    );
    await element.updateComplete;
    expect(drawer).toHaveClass('opened');

    fireEvent.click(shadowRoot.querySelector('.scrim')!);
    await element.updateComplete;
    expect(drawer).not.toHaveClass('opened');
  });

  it('follows the path and closes the drawer when another page swaps in', async () => {
    const { element, shadowRoot, shadowRootForWithin } = await fixture<AppHeader>(
      html`<app-header path="/"></app-header>`,
    );
    toolbar(shadowRoot).dispatchEvent(
      new CustomEvent('drawer-opened-changed', { detail: { value: true } }),
    );
    window.history.pushState({}, '', '/blog');

    document.dispatchEvent(new Event('astro:after-swap'));
    await element.updateComplete;

    expect(element.path).toBe('/blog');
    expect(shadowRoot.querySelector('.drawer')).not.toHaveClass('opened');
    expect(within(shadowRootForWithin).getByRole('link', { name: 'Blog' })).toHaveClass('selected');
    window.history.pushState({}, '', '/');
  });

  it('removes the header shadow while a page element is stuck below it', async () => {
    const { shadowRoot } = await fixture<AppHeader>(html`<app-header></app-header>`);
    const header = shadowRoot.querySelector('#header');

    window.dispatchEvent(new CustomEvent('element-sticked', { detail: { sticked: true } }));
    expect(header).toHaveClass('remove-shadow');

    window.dispatchEvent(new CustomEvent('element-sticked', { detail: { sticked: false } }));
    expect(header).not.toHaveClass('remove-shadow');
  });

  it('links the drawer to the first available ticket', async () => {
    setStoreState({
      tickets: new Success([
        { name: 'Early bird', url: 'https://example.com/early', available: false },
        { name: 'Regular', url: 'https://example.com/regular', available: true },
      ] as Ticket[]),
    });
    const { shadowRootForWithin } = await fixture<AppHeader>(html`<app-header></app-header>`);

    expect(within(shadowRootForWithin).getByRole('link', { name: 'Buy ticket' })).toHaveAttribute(
      'href',
      'https://example.com/regular',
    );
  });
});
