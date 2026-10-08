import { fireEvent, within } from '@testing-library/dom';
import { html, type TemplateResult } from 'lit';
import { describe, expect, it, vi } from 'vitest';
import { fixture } from '../../../__tests__/helpers/fixtures';
import './hb-button';
import type { HbButton } from './hb-button';

const render = async (template: TemplateResult) => {
  const { element, shadowRootForWithin } = await fixture<HbButton>(template);
  return { element, view: within(shadowRootForWithin) };
};

describe('hb-button', () => {
  it('renders a button with its label', async () => {
    const { view } = await render(html`<hb-button>Save</hb-button>`);
    const button = view.getByRole('button');

    expect(button).toHaveAttribute('type', 'button');
    expect(button).not.toHaveAttribute('aria-expanded');
    expect(view.queryByRole('link')).toBeNull();
  });

  it('renders a link with href', async () => {
    const { view } = await render(
      html`<hb-button href="https://example.com" target="_blank">Tickets</hb-button>`,
    );
    const link = view.getByRole('link');

    expect(link).toHaveAttribute('href', 'https://example.com');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(view.queryByRole('button')).toBeNull();
  });

  it('keeps same-site links without rel', async () => {
    const { view } = await render(html`<hb-button href="/speakers">All</hb-button>`);

    expect(view.getByRole('link')).not.toHaveAttribute('rel');
  });

  it('renders a disabled link as a disabled button', async () => {
    const { view } = await render(html`<hb-button href="/tickets" disabled>Sold out</hb-button>`);

    expect(view.queryByRole('link')).toBeNull();
    expect(view.getByRole('button')).toBeDisabled();
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
    const { element, view } = await render(html`<hb-button>More</hb-button>`);

    element.expanded = false;
    element.haspopup = 'menu';
    await element.updateComplete;

    expect(view.getByRole('button')).toHaveAttribute('aria-expanded', 'false');
    expect(view.getByRole('button')).toHaveAttribute('aria-haspopup', 'menu');
  });

  it('reflects its variant, size and icon position for styling', async () => {
    const { element } = await render(
      html`<hb-button variant="outlined" size="l" trailing-icon>Next</hb-button>`,
    );

    expect(element).toHaveAttribute('variant', 'outlined');
    expect(element).toHaveAttribute('size', 'l');
    expect(element.trailingIcon).toBe(true);
  });
});
