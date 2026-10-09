import { fireEvent, screen, within } from '@testing-library/dom';
import { html } from 'lit';
import { describe, expect, it, vi } from 'vitest';
import { fixture } from '../../../__tests__/helpers/fixtures';
import './hb-button';
import './hb-menu';
import type { HbButton } from './hb-button';
import type { HbMenu } from './hb-menu';

const renderMenu = async (onDownload = vi.fn()) => {
  const result = await fixture<HbMenu>(html`
    <hb-menu>
      <hb-button slot="trigger">Add to calendar</hb-button>
      <a role="menuitem" href="https://calendar.google.com" target="_blank">Google Calendar</a>
      <button role="menuitem" @click="${() => onDownload()}">Download</button>
    </hb-menu>
  `);
  const trigger = screen.getByText<HbButton>('Add to calendar');
  await trigger.updateComplete;
  return {
    ...result,
    trigger,
    triggerButton: () => within(trigger.shadowRoot as unknown as HTMLElement).getByRole('button'),
    menu: () => within(result.shadowRootForWithin).getByRole('menu', { hidden: true }),
    google: screen.getByRole('menuitem', { name: 'Google Calendar', hidden: true }),
    download: screen.getByRole('menuitem', { name: 'Download', hidden: true }),
  };
};

describe('hb-menu', () => {
  it('is closed at first, and its trigger says it opens a menu', async () => {
    const { element, menu, triggerButton } = await renderMenu();

    expect(element.open).toBe(false);
    expect(menu()).not.toHaveAttribute('data-popover-open');
    expect(triggerButton()).toHaveAttribute('aria-haspopup', 'menu');
    expect(triggerButton()).toHaveAttribute('aria-expanded', 'false');
  });

  it('opens from its trigger and focuses the first item', async () => {
    const { element, menu, trigger, triggerButton, google } = await renderMenu();

    fireEvent.click(trigger);
    await element.updateComplete;
    await trigger.updateComplete;

    expect(element.open).toBe(true);
    expect(menu()).toHaveAttribute('data-popover-open');
    expect(triggerButton()).toHaveAttribute('aria-expanded', 'true');
    expect(google).toHaveFocus();

    fireEvent.click(trigger);

    expect(element.open).toBe(false);
  });

  it('moves between items with the arrow keys', async () => {
    const { element, google, download } = await renderMenu();
    element.show();

    fireEvent.keyDown(google, { key: 'ArrowDown' });
    expect(download).toHaveFocus();

    fireEvent.keyDown(download, { key: 'ArrowDown' });
    expect(google).toHaveFocus();

    fireEvent.keyDown(google, { key: 'ArrowUp' });
    expect(download).toHaveFocus();

    fireEvent.keyDown(download, { key: 'Home' });
    expect(google).toHaveFocus();
  });

  // A native trigger, because JSDOM does not delegate focus into hb-button.
  it('closes with Escape and gives focus back to the trigger', async () => {
    const { element } = await fixture<HbMenu>(html`
      <hb-menu>
        <button slot="trigger">More</button>
        <button role="menuitem">Download</button>
      </hb-menu>
    `);
    element.show();
    const item = screen.getByRole('menuitem');

    expect(item).toHaveFocus();

    fireEvent.keyDown(item, { key: 'Escape' });

    expect(element.open).toBe(false);
    expect(screen.getByRole('button', { name: 'More' })).toHaveFocus();
  });

  it('closes after an item is chosen', async () => {
    const onDownload = vi.fn();
    const { element, download } = await renderMenu(onDownload);
    element.show();

    fireEvent.click(download);

    expect(onDownload).toHaveBeenCalledOnce();
    expect(element.open).toBe(false);
  });

  it('closes on a click outside', async () => {
    const { element, google } = await renderMenu();
    element.show();

    google.dispatchEvent(new Event('pointerdown', { bubbles: true, composed: true }));
    expect(element.open).toBe(true);

    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    expect(element.open).toBe(false);
  });
});
