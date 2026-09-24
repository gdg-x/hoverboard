import { describe, expect, it, vi } from 'vitest';
import { fireEvent } from '@testing-library/dom';
import { html } from 'lit';
import { fixture } from '../../../__tests__/helpers/fixtures';
import { scrollToElement } from '../../utils/scrolling';
import type { TocMarkdown } from './toc-markdown';
import './toc-markdown';

// toc-markdown scrolls headers into view via scrolling.ts, which imports
// header-toolbar.ts (for HEADER_HEIGHT) which imports the router, calling
// getConfig(CONFIG.URL) at module load time. Mock it out entirely.
vi.mock('../../utils/scrolling', () => ({
  scrollToElement: vi.fn(),
}));

const content = ['## Section One', '', '### Sub A', '', '### Sub B', '', '## Section Two'].join(
  '\n',
);

describe('toc-markdown', () => {
  it('defines a component', () => {
    expect(customElements.get('toc-markdown')).toBeDefined();
  });

  it('renders a table of contents column for each h2, with its h3s as subheaders', async () => {
    const { shadowRoot } = await fixture<TocMarkdown>(
      html`<toc-markdown content="${content}"></toc-markdown>`,
    );

    const columns = shadowRoot.querySelectorAll('.col');
    expect(columns).toHaveLength(2);
    expect(columns[0]).toHaveTextContent('Section One');
    expect(columns[1]).toHaveTextContent('Section Two');

    const subheaders = shadowRoot.querySelectorAll('.col-content');
    expect(subheaders).toHaveLength(2);
    expect(subheaders[0]).toHaveTextContent('Sub A');
    expect(subheaders[1]).toHaveTextContent('Sub B');
  });

  it('renders the markdown content alongside the table of contents', async () => {
    const { shadowRoot } = await fixture<TocMarkdown>(
      html`<toc-markdown content="${content}"></toc-markdown>`,
    );

    expect(shadowRoot.querySelector('.markdown-wrapper h2')).toHaveTextContent('Section One');
  });

  it('scrolls to the linked header when a subheader link is clicked', async () => {
    const { shadowRoot } = await fixture<TocMarkdown>(
      html`<toc-markdown content="${content}"></toc-markdown>`,
    );
    const link = shadowRoot.querySelector<HTMLAnchorElement>('.col-content')!;
    const targetId = link.getAttribute('href')!.split('#')[1]!;
    const target = shadowRoot.querySelector(`.markdown-wrapper #${targetId}`)!;

    fireEvent.click(link);

    expect(vi.mocked(scrollToElement)).toHaveBeenCalledWith(target);
  });

  it('scrolls to the header matching the location hash on connect', async () => {
    window.location.hash = '#sub-a';

    await fixture<TocMarkdown>(html`<toc-markdown content="${content}"></toc-markdown>`);

    expect(vi.mocked(scrollToElement)).toHaveBeenCalled();
    window.location.hash = '';
  });

  it('renders nothing in the table of contents when there are no headers', async () => {
    const { shadowRoot } = await fixture<TocMarkdown>(
      html`<toc-markdown content="Just a paragraph"></toc-markdown>`,
    );

    expect(shadowRoot.querySelectorAll('.col')).toHaveLength(0);
  });
});
