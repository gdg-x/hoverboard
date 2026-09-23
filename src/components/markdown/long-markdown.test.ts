import { describe, expect, it } from 'vitest';
import { html } from 'lit';
import { fixture } from '../../../__tests__/helpers/fixtures';
import './long-markdown';

describe('long-markdown', () => {
  it('defines a component', () => {
    expect(customElements.get('long-markdown')).toBeDefined();
  });

  it('renders parsed markdown content', async () => {
    const { shadowRoot } = await fixture(html`<long-markdown content="# Title"></long-markdown>`);

    expect(shadowRoot.querySelector('.markdown-html h1')).toHaveTextContent('Title');
  });
});
