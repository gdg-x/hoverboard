import { Success } from '@abraham/remotedata';
import { describe, expect, it, jest } from '@jest/globals';
import { html } from 'lit';
import { fixture } from '../../__tests__/helpers/fixtures';
import { navigation, signIn, signOut as signOutText } from '../utils/data';
import type { HeaderToolbar } from './header-toolbar';

jest.mock('../router', () => ({
  selectRouteName: jest.fn(() => 'home'),
}));
jest.mock('../store/auth', () => ({
  __esModule: true,
  ...jest.requireActual<typeof import('../store/auth')>('../store/auth'),
  signOut: jest.fn(),
}));

import './header-toolbar';

const user = {
  uid: 'user-id',
  displayName: 'Ada Lovelace',
  email: 'ada@example.com',
  photoURL: 'https://example.com/ada.png',
  phoneNumber: null,
  providerId: 'google.com',
};

describe('header-toolbar', () => {
  it('defines a component', () => {
    expect(customElements.get('header-toolbar')).toBeDefined();
  });

  it('renders a tab for every navigation item', async () => {
    const { shadowRoot } = await fixture<HeaderToolbar>(html`<header-toolbar></header-toolbar>`);

    const tabs = shadowRoot.querySelectorAll('.nav-item');
    expect(tabs).toHaveLength(navigation.length);
    expect(tabs[0]?.querySelector('a')).toHaveAttribute('href', navigation[0]?.permalink);
    expect(tabs[0]).toHaveTextContent(navigation[0]?.label ?? '');
  });

  it('shows a sign-in tab when signed out and hides the profile menu', async () => {
    const { element, shadowRoot } = await fixture<HeaderToolbar>(
      html`<header-toolbar></header-toolbar>`,
    );
    element['signedIn'] = false;
    await element.updateComplete;

    expect(shadowRoot.querySelector('.signin-tab')).not.toHaveAttribute('hidden');
    expect(shadowRoot.querySelector('.signin-tab')).toHaveTextContent(signIn);
    expect(shadowRoot.querySelector('.profile-menu')).toHaveAttribute('hidden');
  });

  it('shows profile details and hides the sign-in tab when signed in', async () => {
    const { element, shadowRoot } = await fixture<HeaderToolbar>(
      html`<header-toolbar></header-toolbar>`,
    );
    element['signedIn'] = true;
    element['user'] = new Success(user);
    await element.updateComplete;

    expect(shadowRoot.querySelector('.signin-tab')).toHaveAttribute('hidden');
    expect(shadowRoot.querySelector('.profile-menu')).not.toHaveAttribute('hidden');
    expect(shadowRoot.querySelector('.profile-name')).toHaveTextContent(user.displayName);
    expect(shadowRoot.querySelector('.profile-email')).toHaveTextContent(user.email);
    expect(shadowRoot.querySelector('.profile-action')).toHaveTextContent(signOutText);
  });

  it('opens the profile dropdown when the profile image is clicked', async () => {
    const { element, shadowRoot } = await fixture<HeaderToolbar>(
      html`<header-toolbar></header-toolbar>`,
    );
    element['signedIn'] = true;
    element['user'] = new Success(user);
    await element.updateComplete;

    expect(shadowRoot.querySelector('.dropdown-panel')).not.toHaveAttribute('open');

    shadowRoot.querySelector<HTMLElement>('.profile-image')!.click();
    await element.updateComplete;

    expect(shadowRoot.querySelector('.dropdown-panel')).toHaveAttribute('open');
  });

  it('dispatches drawer-opened-changed when the menu button is clicked', async () => {
    const { element, shadowRoot } = await fixture<HeaderToolbar>(
      html`<header-toolbar></header-toolbar>`,
    );
    const listener = jest.fn();
    element.addEventListener('drawer-opened-changed', listener);

    shadowRoot.querySelector<HTMLElement>('.icon-button[aria-label="menu"]')!.click();
    await element.updateComplete;

    expect(element.drawerOpened).toBe(true);
    expect(listener).toHaveBeenCalledTimes(1);
    expect((listener.mock.calls[0]?.[0] as CustomEvent).detail).toEqual({ value: true });
  });

  it('hides the menu button on laptop-plus viewports and shows the logo', async () => {
    const { element, shadowRoot } = await fixture<HeaderToolbar>(
      html`<header-toolbar></header-toolbar>`,
    );
    element['viewport'] = { isPhone: false, isTabletPlus: true, isLaptopPlus: true };
    await element.updateComplete;

    expect(shadowRoot.querySelector('.icon-button[aria-label="menu"]')).toHaveAttribute('hidden');
    expect(shadowRoot.querySelector('.toolbar-logo')).not.toHaveAttribute('hidden');
  });

  it('positions the selection bar under the selected nav item', async () => {
    const { element, shadowRoot } = await fixture<HeaderToolbar>(
      html`<header-toolbar></header-toolbar>`,
    );

    const selected = shadowRoot.querySelector<HTMLElement>('.nav-item.selected');
    const bar = shadowRoot.querySelector<HTMLElement>('.selection-bar');
    expect(selected).not.toBeNull();
    Object.defineProperty(selected, 'offsetLeft', { value: 42, configurable: true });
    Object.defineProperty(selected, 'offsetWidth', { value: 84, configurable: true });

    // jsdom doesn't compute real layout metrics, so re-invoke the private measurement hook
    // directly after stubbing offsetLeft/offsetWidth to assert the positioning logic itself.
    (element as unknown as { positionSelectionBar(): void }).positionSelectionBar();

    expect(bar?.style.left).toBe('42px');
    expect(bar?.style.width).toBe('84px');
  });
});
