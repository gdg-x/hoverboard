import { describe, expect, it } from 'vitest';
import { html } from 'lit';
import { fixture } from '../../__tests__/helpers/fixtures';
import './content-loader';

describe('content-loader', () => {
  it('defines a component', () => {
    expect(customElements.get('content-loader')).toBeDefined();
  });

  it('renders the requested number of loading cards', async () => {
    const { shadowRoot } = await fixture(
      html`<content-loader .itemsCount="${3}"></content-loader>`,
    );

    expect(shadowRoot.querySelectorAll('.content')).toHaveLength(3);
  });

  it('applies card customization properties to the host', async () => {
    const { element } = await fixture(
      html`<content-loader .cardHeight="${'200px'}" .cardWidth="${'320px'}"></content-loader>`,
    );

    expect(element.style.getPropertyValue('--card-height')).toBe('200px');
    expect(element.style.getPropertyValue('--card-width')).toBe('320px');
  });
});
