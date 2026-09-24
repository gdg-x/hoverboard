import { describe, expect, it } from 'vitest';
import { html } from 'lit';
import { fixture } from '../../../__tests__/helpers/fixtures';
import './short-markdown';

describe('short-markdown', () => {
  it('defines a component', () => {
    expect(customElements.get('short-markdown')).toBeDefined();
  });

  it('renders parsed markdown content', async () => {
    const { shadowRoot } = await fixture(html`<short-markdown content="# Title"></short-markdown>`);

    expect(shadowRoot.querySelector('.markdown-html h1')).toHaveTextContent('Title');
  });
});
