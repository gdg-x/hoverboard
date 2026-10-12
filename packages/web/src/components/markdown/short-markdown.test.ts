import { describe, expect, it } from 'vitest';
import { type CSSResult, html } from 'lit';
import { fixture } from '../../../__tests__/helpers/fixtures';
import { ShortMarkdown } from './short-markdown';

describe('short-markdown', () => {
  it('defines a component', () => {
    expect(customElements.get('short-markdown')).toBeDefined();
  });

  it('renders parsed markdown content', async () => {
    const { shadowRoot } = await fixture(html`<short-markdown content="# Title"></short-markdown>`);

    expect(shadowRoot.querySelector('.markdown-html h1')).toHaveTextContent('Title');
  });

  it('underlines links, which sit in running text', () => {
    const css = ShortMarkdown.elementStyles.map((style) => (style as CSSResult).cssText).join('');

    expect(css).toMatch(/\ba \{\s*text-decoration: underline;/);
  });
});
