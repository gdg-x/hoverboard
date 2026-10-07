/// <reference types="vite/client" />
import { describe, expect, it } from 'vitest';
import { customElement } from 'lit/decorators.js';
import { html, css } from 'lit';
import { fixture } from '../../__tests__/helpers/fixtures';
import { ThemedElement } from './themed-element';

@customElement('themed-element-test-subject')
class ThemedElementTestSubject extends ThemedElement {
  static override styles = css`
    :host {
      color: rebeccapurple;
    }
  `;

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
  it('prepends the shared theme and block host styles to the subclass styles', async () => {
    await fixture(html`<themed-element-test-subject></themed-element-test-subject>`);
    const { elementStyles } = ThemedElementTestSubject as unknown as { elementStyles: unknown[] };

    expect(elementStyles).toHaveLength(3);
    expect(String(elementStyles[0])).toContain('--primary-color-transparent');
    expect(String(elementStyles[1])).toContain('display: block');
    expect(String(elementStyles[2])).toContain('color: rebeccapurple');
  });

  it('is usable as a base class for rendering subclass content', async () => {
    const { shadowRoot } = await fixture(
      html`<themed-element-test-subject></themed-element-test-subject>`,
    );

    expect(shadowRoot.textContent).toContain('content');
  });

  it('is the base class of every component', () => {
    const sources = import.meta.glob<string>(
      ['../**/*.ts', '!../**/*.test.ts', '!./themed-element.ts'],
      { query: '?raw', import: 'default', eager: true },
    );
    const offenders = Object.keys(sources).filter((path) =>
      /extends LitElement\b/.test(sources[path] ?? ''),
    );

    expect(Object.keys(sources).length).toBeGreaterThan(100);
    expect(offenders).toEqual([]);
  });
});
