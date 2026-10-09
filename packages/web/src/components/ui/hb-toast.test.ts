import { type CSSResult, html } from 'lit';
import { describe, expect, it } from 'vitest';
import { fixture } from '../../../__tests__/helpers/fixtures';
import { HbToast } from './hb-toast';

describe('hb-toast', () => {
  it('opens and closes in a status region', async () => {
    const { element, shadowRoot } = await fixture<HbToast>(html`<hb-toast>Saved</hb-toast>`);
    const toast = shadowRoot.querySelector('[popover]')!;

    expect(toast.closest('[role="status"]')).toBeInTheDocument();
    expect(toast).not.toHaveAttribute('data-popover-open');

    element.open = true;
    await element.updateComplete;

    expect(toast).toHaveAttribute('data-popover-open');

    element.open = false;
    await element.updateComplete;

    expect(toast).not.toHaveAttribute('data-popover-open');
  });

  it('is laid out only while open, so closing it hides it', () => {
    const css = HbToast.elementStyles.map((style) => (style as CSSResult).cssText).join('');

    expect(css).toMatch(/\.toast:popover-open \{\s*display: flex;/);
    expect(css).not.toMatch(/\.toast \{[^}]*display:/);
  });
});
