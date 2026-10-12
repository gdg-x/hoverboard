import { fireEvent, within } from '@testing-library/dom';
import { html } from 'lit';
import { describe, expect, it, vi } from 'vitest';
import { expectNoAxeViolations } from '../../../__tests__/helpers/axe';
import { fixture } from '../../../__tests__/helpers/fixtures';
import './hb-switch';
import type { HbSwitch } from './hb-switch';

describe('hb-switch', () => {
  it('renders a checkbox with the switch role', async () => {
    const { shadowRootForWithin } = await fixture<HbSwitch>(
      html`<hb-switch label="Notifications" checked></hb-switch>`,
    );

    expect(
      within(shadowRootForWithin).getByRole('switch', { name: 'Notifications' }),
    ).toBeChecked();
  });

  it('switches and fires change from the host', async () => {
    const onChange = vi.fn((event: Event) => (event.target as HbSwitch).checked);
    const { element, shadowRootForWithin } = await fixture<HbSwitch>(
      html`<hb-switch
        label="Notifications"
        @change="${(event: Event) => onChange(event)}"
      ></hb-switch>`,
    );

    fireEvent.click(within(shadowRootForWithin).getByRole('switch'));

    expect(element.checked).toBe(true);
    expect(onChange).toHaveReturnedWith(true);
  });

  it('cannot be switched when disabled', async () => {
    const { shadowRootForWithin } = await fixture<HbSwitch>(
      html`<hb-switch label="Notifications" disabled></hb-switch>`,
    );

    expect(within(shadowRootForWithin).getByRole('switch')).toBeDisabled();
  });

  it.each([
    ['off', html`<hb-switch label="Notifications"></hb-switch>`],
    ['on', html`<hb-switch label="Notifications" checked></hb-switch>`],
    ['disabled', html`<hb-switch label="Notifications" disabled></hb-switch>`],
  ])('has no axe violations when %s', async (_state, template) => {
    const { element } = await fixture(template);

    await expectNoAxeViolations(element);
  });
});
