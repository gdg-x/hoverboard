import { Failure, Initialized, Pending, Success } from '@abraham/remotedata';
import { describe, expect, it, vi } from 'vitest';
import { html } from 'lit';
import { fixture } from '../../../__tests__/helpers/fixtures';
import { updateNotificationsSubscribers } from '../../store/update-notifications-subscribers';
import type { HbIconButton } from '../ui/hb-icon-button';
import type { HbSwitch } from '../ui/hb-switch';
import type { NotificationToggle } from './notification-toggle';

import './notification-toggle';

vi.mock('../../store/update-notifications-subscribers', async (importOriginal) => ({
  __esModule: true,
  ...(await importOriginal<typeof import('../../store/update-notifications-subscribers')>()),
  updateNotificationsSubscribers: vi.fn(),
}));

describe('notification-toggle', () => {
  it('defines a component', () => {
    expect(customElements.get('notification-toggle')).toBeDefined();
  });

  it('shows the bell-outline icon while not yet requested', async () => {
    const { element, shadowRoot } = await fixture<NotificationToggle>(
      html`<notification-toggle></notification-toggle>`,
    );
    element['notificationPermission'] = new Initialized();
    await element.updateComplete;

    expect(shadowRoot.querySelector('hoverboard-icon')).toHaveAttribute('name', 'bell-outline');
  });

  it('shows the bell icon and general toggle when granted', async () => {
    const { element, shadowRoot } = await fixture<NotificationToggle>(
      html`<notification-toggle></notification-toggle>`,
    );
    element['notificationPermission'] = new Success('token');
    await element.updateComplete;

    expect(shadowRoot.querySelector('hoverboard-icon')).toHaveAttribute('name', 'bell');
    expect(shadowRoot.querySelector('.switch-row')).toHaveTextContent('General notifications');
  });

  it('shows the bell-off icon and blocked message when denied', async () => {
    const { element, shadowRoot } = await fixture<NotificationToggle>(
      html`<notification-toggle></notification-toggle>`,
    );
    element['notificationPermission'] = new Failure(new Error('denied'));
    await element.updateComplete;

    expect(shadowRoot.querySelector('hoverboard-icon')).toHaveAttribute('name', 'bell-off');
    expect(shadowRoot.querySelector('.dropdown-panel')).toHaveTextContent(
      'Please enable notifications in your browser',
    );
  });

  it('shows the unsupported message', async () => {
    const { element, shadowRoot } = await fixture<NotificationToggle>(
      html`<notification-toggle></notification-toggle>`,
    );
    element['notificationPermission'] = new Failure(new Error('unsupported'));
    await element.updateComplete;

    expect(shadowRoot.querySelector('.dropdown-panel')).toHaveTextContent(
      'Notifications are not supported on this device',
    );
  });

  it('shows a pending state', async () => {
    const { element, shadowRoot } = await fixture<NotificationToggle>(
      html`<notification-toggle></notification-toggle>`,
    );
    element['notificationPermission'] = new Pending();
    await element.updateComplete;

    expect(shadowRoot.querySelector('.dropdown-panel')).not.toBeNull();
  });

  it('toggles the dropdown panel open when the trigger is clicked', async () => {
    const { element, shadowRoot } = await fixture<NotificationToggle>(
      html`<notification-toggle></notification-toggle>`,
    );
    element['notificationPermission'] = new Failure(new Error('denied'));
    await element.updateComplete;

    expect(shadowRoot.querySelector('.dropdown-panel')).not.toHaveAttribute('open');

    shadowRoot.querySelector<HTMLElement>('.notifications-trigger')!.click();
    await element.updateComplete;

    expect(shadowRoot.querySelector('.dropdown-panel')).toHaveAttribute('open');
  });

  it('exposes the panel state on the trigger', async () => {
    const { element, shadowRoot } = await fixture<NotificationToggle>(
      html`<notification-toggle></notification-toggle>`,
    );
    element['notificationPermission'] = new Failure(new Error('denied'));
    await element.updateComplete;
    const trigger = shadowRoot.querySelector<HbIconButton>('.notifications-trigger')!;

    expect(trigger.expanded).toBe(false);

    trigger.click();
    await element.updateComplete;

    expect(trigger.expanded).toBe(true);
  });

  it('closes the panel when clicking outside', async () => {
    const { element, shadowRoot } = await fixture<NotificationToggle>(
      html`<notification-toggle></notification-toggle>`,
    );
    element['notificationPermission'] = new Failure(new Error('denied'));
    await element.updateComplete;

    shadowRoot.querySelector<HTMLElement>('.notifications-trigger')!.click();
    await element.updateComplete;
    expect(element['opened']).toBe(true);

    document.body.click();
    await element.updateComplete;

    expect(element['opened']).toBe(false);
  });

  it('toggles general notifications on and off', async () => {
    const mockUpdateNotificationsSubscribers = vi.mocked(updateNotificationsSubscribers);
    const { element, shadowRoot } = await fixture<NotificationToggle>(
      html`<notification-toggle></notification-toggle>`,
    );

    element['notificationPermission'] = new Success('token');
    await element.updateComplete;

    const toggle = shadowRoot.querySelector<HbSwitch>('hb-switch')!;
    toggle.checked = true;
    toggle.dispatchEvent(new Event('change'));

    expect(mockUpdateNotificationsSubscribers).toHaveBeenCalledWith('token');
  });
});
