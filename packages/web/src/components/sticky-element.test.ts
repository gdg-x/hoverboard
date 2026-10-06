import { describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/dom';
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

  it('dispatches sticked state changes when the trigger leaves the viewport', async () => {
    const OriginalObserver = window.IntersectionObserver;
    let notify: IntersectionObserverCallback = () => undefined;
    const observe = vi.fn();
    window.IntersectionObserver = class {
      constructor(callback: IntersectionObserverCallback) {
        notify = callback;
      }
      observe = observe;
      disconnect = vi.fn();
    } as unknown as typeof IntersectionObserver;
    const { element, shadowRootForWithin } = await fixture<StickyElement>(
      html`<sticky-element></sticky-element>`,
    );
    window.IntersectionObserver = OriginalObserver;
    const trigger = within(shadowRootForWithin).getByTestId('trigger') as HTMLDivElement;
    const content = within(shadowRootForWithin).getByTestId('content') as HTMLDivElement;
    const stickedHandler = vi.fn();
    element.addEventListener('element-sticked', stickedHandler);
    Object.defineProperty(content, 'offsetHeight', { configurable: true, value: 48 });
    const entry = (isIntersecting: boolean, top: number) =>
      [{ isIntersecting, boundingClientRect: { top } }] as IntersectionObserverEntry[];

    expect(observe).toHaveBeenCalledWith(trigger);

    notify(entry(false, -10), {} as IntersectionObserver);

    expect(content).toHaveClass('sticked');
    expect(element.style.height).toBe('48px');
    expect(stickedHandler).toHaveBeenCalledWith(
      expect.objectContaining({ detail: { sticked: true } }),
    );

    notify(entry(true, 20), {} as IntersectionObserver);

    expect(content).not.toHaveClass('sticked');
    expect(stickedHandler).toHaveBeenLastCalledWith(
      expect.objectContaining({ detail: { sticked: false } }),
    );
  });
});
