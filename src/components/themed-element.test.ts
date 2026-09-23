import { describe, expect, it } from 'vitest';
import { customElement } from 'lit/decorators.js';
import { html } from 'lit';
import { fixture } from '../../__tests__/helpers/fixtures';
import { ThemedElement } from './themed-element';

@customElement('themed-element-test-subject')
class ThemedElementTestSubject extends ThemedElement {
  override render() {
    return html`<div>content</div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'themed-element-test-subject': ThemedElementTestSubject;
  }
}

describe('themed-element', () => {
  it('composes the shared theme styles with a block display host style', () => {
    const styles = ThemedElement.styles as unknown[];

    expect(styles).toHaveLength(2);
    expect(String(styles[styles.length - 1])).toContain('display: block');
  });

  it('is usable as a base class for rendering subclass content', async () => {
    const { shadowRoot } = await fixture(
      html`<themed-element-test-subject></themed-element-test-subject>`,
    );

    expect(shadowRoot.textContent).toContain('content');
  });
});
