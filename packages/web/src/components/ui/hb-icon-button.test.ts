import { fireEvent, within } from '@testing-library/dom';
import { html } from 'lit';
import { describe, expect, it, vi } from 'vitest';
import { fixture } from '../../../__tests__/helpers/fixtures';
import './hb-icon-button';
import type { HbIconButton } from './hb-icon-button';

describe('hb-icon-button', () => {
  it('names the button with its label', async () => {
    const { shadowRootForWithin } = await fixture<HbIconButton>(
      html`<hb-icon-button label="Close"><svg></svg></hb-icon-button>`,
    );

    expect(within(shadowRootForWithin).getByRole('button', { name: 'Close' })).toBeEnabled();
  });

  it('renders a named link with href', async () => {
    const { shadowRootForWithin } = await fixture<HbIconButton>(
      html`<hb-icon-button
        label="GitHub"
        href="https://github.com"
        target="_blank"
      ></hb-icon-button>`,
    );

    expect(within(shadowRootForWithin).getByRole('link', { name: 'GitHub' })).toHaveAttribute(
      'rel',
      'noopener noreferrer',
    );
  });

  it('reports whether it is pressed', async () => {
    const { element, shadowRootForWithin } = await fixture<HbIconButton>(
      html`<hb-icon-button label="Bookmark"></hb-icon-button>`,
    );
    const button = within(shadowRootForWithin).getByRole('button');

    expect(button).not.toHaveAttribute('aria-pressed');

    element.pressed = true;
    await element.updateComplete;

    expect(button).toHaveAttribute('aria-pressed', 'true');
  });

  it('does not call click listeners when disabled', async () => {
    const onClick = vi.fn();
    const { element, shadowRootForWithin } = await fixture<HbIconButton>(
      html`<hb-icon-button label="Up" disabled @click="${() => onClick()}"></hb-icon-button>`,
    );

    fireEvent.click(element);

    expect(onClick).not.toHaveBeenCalled();
    expect(within(shadowRootForWithin).getByRole('button')).toBeDisabled();
  });
});
