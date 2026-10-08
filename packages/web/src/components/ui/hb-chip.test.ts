import { html } from 'lit';
import { describe, expect, it } from 'vitest';
import { fixture } from '../../../__tests__/helpers/fixtures';
import './hb-chip';
import type { HbChip } from './hb-chip';

describe('hb-chip', () => {
  it('renders a label', async () => {
    const { shadowRoot } = await fixture<HbChip>(html`<hb-chip accent="1">Web</hb-chip>`);

    expect(shadowRoot.querySelector('span.chip')).toBeInTheDocument();
    expect(shadowRoot.querySelector('a, button')).toBeNull();
  });

  it('renders a link with href', async () => {
    const { shadowRoot } = await fixture<HbChip>(
      html`<hb-chip href="/speakers?tag=web">Web</hb-chip>`,
    );

    expect(shadowRoot.querySelector('a')).toHaveAttribute('href', '/speakers?tag=web');
  });

  it('renders a filter as a toggle button', async () => {
    const { element, shadowRoot } = await fixture<HbChip>(html`<hb-chip filter>Web</hb-chip>`);
    const button = shadowRoot.querySelector('button')!;

    expect(button).toHaveAttribute('aria-pressed', 'false');

    element.selected = true;
    await element.updateComplete;

    expect(button).toHaveAttribute('aria-pressed', 'true');
  });
});
