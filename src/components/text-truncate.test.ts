import { describe, expect, it } from 'vitest';
import { html } from 'lit';
import { fixture } from '../../__tests__/helpers/fixtures';
import './text-truncate';

describe('text-truncate', () => {
  it('defines a component', () => {
    expect(customElements.get('text-truncate')).toBeDefined();
  });

  it('renders slotted content', async () => {
    const { shadowRoot } = await fixture(
      html`<text-truncate><p>Some long text</p></text-truncate>`,
    );

    const slot = shadowRoot.querySelector('slot')!;
    expect(slot.assignedElements()[0]).toHaveTextContent('Some long text');
  });

  it('defaults to clamping at 3 lines', async () => {
    const { element } = await fixture(html`<text-truncate></text-truncate>`);

    expect(element).not.toHaveAttribute('lines');
  });

  it('supports overriding the clamped number of lines via the lines attribute', async () => {
    const { element } = await fixture(html`<text-truncate lines="5"></text-truncate>`);

    expect(element).toHaveAttribute('lines', '5');
  });
});
