import { fireEvent, within } from '@testing-library/dom';
import { type CSSResult, html, type TemplateResult } from 'lit';
import { describe, expect, it, vi } from 'vitest';
import { expectNoAxeViolations } from '../../../__tests__/helpers/axe';
import { fixture } from '../../../__tests__/helpers/fixtures';
import './hb-button';
import type { HbButton } from './hb-button';

const render = async (template: TemplateResult) => {
  const { element, shadowRootForWithin } = await fixture<HbButton>(template);
  return { element, container: shadowRootForWithin };
};

describe('hb-button', () => {
  it('renders a button with its label', async () => {
    const { container } = await render(html`<hb-button>Save</hb-button>`);
    const button = within(container).getByRole('button');

    expect(button).toHaveAttribute('type', 'button');
    expect(button).not.toHaveAttribute('aria-expanded');
    expect(within(container).queryByRole('link')).toBeNull();
  });

  it('renders a link with href', async () => {
    const { container } = await render(
      html`<hb-button href="https://example.com" target="_blank">Tickets</hb-button>`,
    );
    const link = within(container).getByRole('link');

    expect(link).toHaveAttribute('href', 'https://example.com');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(within(container).queryByRole('button')).toBeNull();
  });

  it('keeps same-site links without rel', async () => {
    const { container } = await render(html`<hb-button href="/speakers">All</hb-button>`);

    expect(within(container).getByRole('link')).not.toHaveAttribute('rel');
  });

  it('renders a disabled link as a disabled button', async () => {
    const { container } = await render(
      html`<hb-button href="/tickets" disabled>Sold out</hb-button>`,
    );

    expect(within(container).queryByRole('link')).toBeNull();
    expect(within(container).getByRole('button')).toBeDisabled();
  });

  it('does not call click listeners when disabled', async () => {
    const onClick = vi.fn();
    const { element } = await render(
      html`<hb-button disabled @click="${() => onClick()}">Save</hb-button>`,
    );

    fireEvent.click(element);
    element.disabled = false;
    await element.updateComplete;
    fireEvent.click(element);

    expect(onClick).toHaveBeenCalledOnce();
    expect(element).toBeEnabled();
  });

  it('reports whether its menu is open', async () => {
    const { element, container } = await render(html`<hb-button>More</hb-button>`);

    element.expanded = false;
    element.haspopup = 'menu';
    await element.updateComplete;

    expect(within(container).getByRole('button')).toHaveAttribute('aria-expanded', 'false');
    expect(within(container).getByRole('button')).toHaveAttribute('aria-haspopup', 'menu');
  });

  it('reflects its variant, size and icon position for styling', async () => {
    const { element } = await render(
      html`<hb-button variant="outlined" size="l" trailing-icon>Next</hb-button>`,
    );

    expect(element).toHaveAttribute('variant', 'outlined');
    expect(element).toHaveAttribute('size', 'l');
    expect(element.trailingIcon).toBe(true);
  });

  it('has a call to action variant in the theme colors', async () => {
    const { element } = await render(html`<hb-button variant="cta">Buy</hb-button>`);

    expect(element).toHaveAttribute('variant', 'cta');
    expect(
      [...(element.constructor as typeof HbButton).elementStyles]
        .map((style) => (style as CSSResult).cssText)
        .join(''),
    ).toMatch(
      /:host\(\[variant='cta'\]\)\s*\{\s*--hb-button-background: var\(--hb-cta-background\)/,
    );
  });

  it.each([
    ['a button', html`<hb-button>Save</hb-button>`],
    ['a link', html`<hb-button href="/tickets">Tickets</hb-button>`],
    ['disabled', html`<hb-button disabled>Save</hb-button>`],
    ['a disabled link', html`<hb-button href="/tickets" disabled>Sold out</hb-button>`],
    [
      'an open menu trigger',
      html`<hb-button .expanded=${true} .haspopup=${'menu'}>More</hb-button>`,
    ],
  ])('has no axe violations as %s', async (_state, template) => {
    const { element } = await render(template);

    await expectNoAxeViolations(element);
  });
});
