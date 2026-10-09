import { fireEvent, within } from '@testing-library/dom';
import { html } from 'lit';
import { describe, expect, it, vi } from 'vitest';
import { fixture } from '../../../__tests__/helpers/fixtures';
import './hb-text-field';
import type { HbTextField } from './hb-text-field';

describe('hb-text-field', () => {
  it('labels the input', async () => {
    const { shadowRootForWithin } = await fixture<HbTextField>(
      html`<hb-text-field label="Email" type="email" required></hb-text-field>`,
    );
    const input = within(shadowRootForWithin).getByLabelText('Email');

    expect(input).toHaveAttribute('type', 'email');
    expect(input).toBeRequired();
    expect(input).not.toHaveAttribute('aria-describedby');
  });

  it('renders a textarea', async () => {
    const { shadowRootForWithin } = await fixture<HbTextField>(
      html`<hb-text-field label="Comment" type="textarea" maxlength="256"></hb-text-field>`,
    );
    const textarea = within(shadowRootForWithin).getByRole('textbox', { name: 'Comment' });

    expect(textarea.tagName).toBe('TEXTAREA');
    expect(textarea).toHaveAttribute('maxlength', '256');
  });

  it('describes the input with its hint and error', async () => {
    const { shadowRootForWithin } = await fixture<HbTextField>(
      html`<hb-text-field
        label="Email"
        hint="We never share it"
        error="Enter an email"
      ></hb-text-field>`,
    );
    const input = within(shadowRootForWithin).getByRole('textbox', { name: 'Email' });

    expect(input).toHaveAccessibleDescription('We never share it Enter an email');
    expect(input).toBeInvalid();
  });

  it('updates its value and passes on input events', async () => {
    const onInput = vi.fn((event: Event) => (event.target as HbTextField).value);
    const { element, shadowRootForWithin } = await fixture<HbTextField>(
      html`<hb-text-field
        label="Email"
        @input="${(event: Event) => onInput(event)}"
      ></hb-text-field>`,
    );

    fireEvent.input(within(shadowRootForWithin).getByRole('textbox'), {
      target: { value: 'ada@example.com' },
      composed: true,
    });

    expect(element.value).toBe('ada@example.com');
    expect(onInput).toHaveReturnedWith('ada@example.com');
  });

  it('fires change from the host', async () => {
    const onChange = vi.fn();
    const { shadowRootForWithin } = await fixture<HbTextField>(
      html`<hb-text-field label="Email" @change="${() => onChange()}"></hb-text-field>`,
    );

    fireEvent.change(within(shadowRootForWithin).getByRole('textbox'), {
      target: { value: 'a' },
    });

    expect(onChange).toHaveBeenCalledOnce();
  });

  it('shows a new value set from outside', async () => {
    const { element, shadowRootForWithin } = await fixture<HbTextField>(
      html`<hb-text-field label="Email"></hb-text-field>`,
    );

    element.value = 'grace@example.com';
    await element.updateComplete;

    expect(within(shadowRootForWithin).getByRole('textbox')).toHaveValue('grace@example.com');
  });

  it('checks the input validity', async () => {
    const { element } = await fixture<HbTextField>(
      html`<hb-text-field label="Email" required></hb-text-field>`,
    );

    expect(element.reportValidity()).toBe(false);

    element.value = 'ada@example.com';
    await element.updateComplete;

    expect(element.checkValidity()).toBe(true);
  });
});
