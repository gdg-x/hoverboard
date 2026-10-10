import { Failure, Initialized, Pending, Success } from '@abraham/remotedata';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { html, nothing, render as litRender } from 'lit';
import { fixture } from '../../../__tests__/helpers/fixtures';
import { store } from '../../store';
import {
  clearNotificationsSubscribers,
  updateNotificationsSubscribers,
} from '../../store/update-notifications-subscribers';
import type { HbSwitch } from '../ui/hb-switch';
import type { NotificationSettings } from './notification-settings';
import './notification-settings';

vi.mock('../../store/update-notifications-subscribers', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../store/update-notifications-subscribers')>()),
  clearNotificationsSubscribers: vi.fn(),
  updateNotificationsSubscribers: vi.fn(),
}));

const render = async (props: Record<string, unknown>) => {
  const result = await fixture<NotificationSettings>(
    html`<notification-settings></notification-settings>`,
  );
  Object.assign(result.element, props);
  await result.element.updateComplete;
  return result;
};

describe('notification-settings', () => {
  afterEach(() => {
    litRender(nothing, document.body);
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('asks to turn notifications on, then closes', async () => {
    const dispatch = vi.spyOn(store, 'dispatch').mockReturnValue(undefined as never);
    const { element, shadowRoot } = await render({
      notificationPermission: new Initialized(),
      online: true,
    });
    const close = vi.fn();
    element.addEventListener('close', close);

    expect(shadowRoot).toHaveTextContent('Enable notifications');
    shadowRoot.querySelector<HTMLElement>('.panel-actions hb-button')!.click();

    expect(dispatch).toHaveBeenCalled();
    expect(close).toHaveBeenCalled();
  });

  it('shows the prompt while the browser answers', async () => {
    const { shadowRoot } = await render({ notificationPermission: new Pending() });

    expect(shadowRoot).toHaveTextContent('Enable notifications');
    expect(shadowRoot).toHaveTextContent('Loading...');
  });

  it('turns general notifications on and off once granted', async () => {
    const { shadowRoot } = await render({ notificationPermission: new Success('token') });
    const toggle = shadowRoot.querySelector<HbSwitch>('.switch-row')!;

    expect(toggle).toHaveTextContent('General notifications');
    toggle.checked = true;
    toggle.dispatchEvent(new Event('change'));
    expect(updateNotificationsSubscribers).toHaveBeenCalledWith('token');

    toggle.checked = false;
    toggle.dispatchEvent(new Event('change'));
    expect(clearNotificationsSubscribers).toHaveBeenCalledWith('token');
  });

  it.each([
    ['denied', 'Please enable notifications in your browser', 'Enable'],
    ['unsupported', 'Notifications are not supported on this device', 'Details'],
  ])(
    'says why notifications are %s, with help that closes the panel',
    async (reason, text, link) => {
      const { element, shadowRoot } = await render({
        notificationPermission: new Failure(new Error(reason)),
      });
      const close = vi.fn();
      element.addEventListener('close', close);
      const help = shadowRoot.querySelector<HTMLElement>('.panel-actions hb-button')!;

      expect(shadowRoot).toHaveTextContent(text);
      expect(help).toHaveTextContent(link);
      expect(help).toHaveAttribute('target', '_blank');
      help.click();
      expect(close).toHaveBeenCalled();
    },
  );

  it('shows an unknown error', async () => {
    const { shadowRoot } = await render({
      notificationPermission: new Failure(new Error('boom')),
    });

    expect(shadowRoot).toHaveTextContent('Unknown error occurred');
  });

  it('needs the internet to turn on notifications', async () => {
    const dispatch = vi.spyOn(store, 'dispatch').mockReturnValue(undefined as never);
    const { shadowRoot } = await render({
      notificationPermission: new Initialized(),
      online: false,
    });

    expect(shadowRoot.querySelector('.offline')).toHaveTextContent(
      'Connect to the internet to turn on notifications.',
    );
    expect(shadowRoot.querySelector('.panel-actions hb-button')).toHaveAttribute('disabled');
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('needs the internet to change general notifications', async () => {
    const { shadowRoot } = await render({
      notificationPermission: new Success('token'),
      online: false,
    });

    expect(shadowRoot.querySelector('hb-switch')).toHaveAttribute('disabled');
    expect(shadowRoot.querySelector('.offline')).toHaveTextContent(
      'Connect to the internet to change general notifications.',
    );
  });
});
