import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, within } from '@testing-library/dom';
import { html } from 'lit';
import { fixture } from '../../__tests__/helpers/fixtures';
import type { StickyElement } from './sticky-element';
import './sticky-element';

describe('sticky-element', () => {
  it('defines a component', () => {
    expect(customElements.get('sticky-element')).toBeDefined();
  });

  it('renders slotted content', async () => {
    await fixture(html`<sticky-element><div data-testid="content">Content</div></sticky-element>`);

    expect(screen.getByTestId('content')).toBeInTheDocument();
  });

  it('dispatches sticked state changes on scroll', async () => {
    const { element, shadowRootForWithin } = await fixture<StickyElement>(
      html`<sticky-element></sticky-element>`,
    );
    const trigger = within(shadowRootForWithin).getByTestId('trigger') as HTMLDivElement;
    const content = within(shadowRootForWithin).getByTestId('content') as HTMLDivElement;
    const stickedHandler = vi.fn();
    element.addEventListener('element-sticked', stickedHandler);

    vi.spyOn(trigger, 'getBoundingClientRect').mockReturnValue({
      bottom: 0,
      height: 0,
      left: 0,
      right: 0,
      top: 0,
      width: 0,
      x: 0,
      y: 0,
      toJSON: () => '',
    });
    Object.defineProperty(content, 'offsetHeight', { configurable: true, value: 48 });

    fireEvent.scroll(window);

    expect(content).toHaveClass('sticked');
    expect(element.style.height).toBe('48px');
    expect(stickedHandler).toHaveBeenCalledWith(
      expect.objectContaining({ detail: { sticked: true } }),
    );
  });
});
