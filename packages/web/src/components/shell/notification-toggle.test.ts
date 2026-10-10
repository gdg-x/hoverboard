import { Failure, Initialized, Success } from '@abraham/remotedata';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { html, nothing, render as litRender } from 'lit';
import { fixture } from '../../../__tests__/helpers/fixtures';
import { store } from '../../store';
import type { HbPopover } from '../ui/hb-popover';
import type { NotificationToggle } from './notification-toggle';
import './notification-toggle';

const render = async (props: Record<string, unknown>) => {
  const result = await fixture<NotificationToggle>(
    html`<notification-toggle></notification-toggle>`,
  );
  Object.assign(result.element, props);
  await result.element.updateComplete;
  return {
    ...result,
    popover: result.shadowRoot.querySelector<HbPopover>('hb-popover')!,
    trigger: result.shadowRoot.querySelector<HTMLElement>('.notifications-trigger')!,
  };
};

describe('notification-toggle', () => {
  afterEach(() => {
    litRender(nothing, document.body);
    vi.restoreAllMocks();
  });

  it.each([
    [new Initialized(), 'bell-outline'],
    [new Success('token'), 'bell'],
    [new Failure(new Error('denied')), 'bell-off'],
  ])('shows the permission in its icon', async (notificationPermission, icon) => {
    const { trigger } = await render({ notificationPermission });

    expect(trigger.querySelector('hoverboard-icon')).toHaveAttribute('name', icon);
  });

  it('opens the settings from the bell', async () => {
    const { popover, trigger } = await render({
      notificationPermission: new Failure(new Error('denied')),
    });

    expect(trigger).toHaveAttribute('slot', 'trigger');
    expect(popover.querySelector('notification-settings')).toBeInTheDocument();

    trigger.click();
    await popover.updateComplete;

    expect(popover.open).toBe(true);
  });

  it('asks the browser the first time it opens, while online', async () => {
    const { trigger } = await render({ notificationPermission: new Initialized(), online: true });
    // After the first render, which asks for the permission without a prompt.
    const dispatch = vi.spyOn(store, 'dispatch').mockReturnValue(undefined as never);

    trigger.click();

    expect(dispatch).toHaveBeenCalledWith(expect.any(Function));
  });

  it('does not ask the browser offline', async () => {
    const { trigger } = await render({ notificationPermission: new Initialized(), online: false });
    // After the first render, which asks for the permission without a prompt.
    const dispatch = vi.spyOn(store, 'dispatch').mockReturnValue(undefined as never);

    trigger.click();

    expect(dispatch).not.toHaveBeenCalled();
  });

  it('closes when the settings are done', async () => {
    const { popover } = await render({ notificationPermission: new Initialized() });
    popover.show();
    await popover.updateComplete;

    popover.querySelector('notification-settings')!.dispatchEvent(new Event('close'));
    await popover.updateComplete;

    expect(popover.open).toBe(false);
  });
});
