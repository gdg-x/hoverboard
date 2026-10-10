import { afterEach, describe, expect, it } from 'vitest';
import { html, nothing, render as litRender } from 'lit';
import { fixture } from '../../../__tests__/helpers/fixtures';
import type { HbIconButton } from './hb-icon-button';
import type { HbPopover } from './hb-popover';
import './hb-icon-button';
import './hb-popover';

const render = () =>
  fixture<HbPopover>(html`
    <hb-popover>
      <button slot="trigger" type="button">Help</button>
      <p>Details</p>
    </hb-popover>
  `);

describe('hb-popover', () => {
  afterEach(() => {
    litRender(nothing, document.body);
  });

  it('opens and closes from its trigger, which says whether it is open', async () => {
    const { element, shadowRoot } = await render();
    const trigger = element.querySelector('button')!;
    const panel = shadowRoot.querySelector('.panel')!;

    expect(getComputedStyle(panel).display).toBe('none');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');

    trigger.click();
    await element.updateComplete;

    expect(element).toHaveAttribute('open');
    expect(getComputedStyle(panel).display).toBe('block');
    expect(trigger).toHaveAttribute('aria-expanded', 'true');

    trigger.click();
    await element.updateComplete;

    expect(element.open).toBe(false);
  });

  it('sets `expanded` on a trigger that has it', async () => {
    const { element } = await fixture<HbPopover>(html`
      <hb-popover>
        <hb-icon-button slot="trigger" label="Notifications"></hb-icon-button>
      </hb-popover>
    `);
    const trigger = element.querySelector<HbIconButton>('hb-icon-button')!;

    element.show();
    await element.updateComplete;

    expect(trigger.expanded).toBe(true);
  });

  it('closes on a click outside, but not on a click inside', async () => {
    const { element } = await render();
    element.show();
    await element.updateComplete;

    element.querySelector('p')!.click();
    await element.updateComplete;
    expect(element.open).toBe(true);

    document.body.click();
    await element.updateComplete;
    expect(element.open).toBe(false);
  });

  it('closes on Escape and gives focus back to the trigger', async () => {
    const { element } = await render();
    const trigger = element.querySelector('button')!;
    element.show();
    await element.updateComplete;

    element
      .querySelector('p')!
      .dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await element.updateComplete;

    expect(element.open).toBe(false);
    expect(document.activeElement).toBe(trigger);
  });
});
