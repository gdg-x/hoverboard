import { afterEach, describe, expect, it, vi } from 'vitest';
import { waitFor } from '@testing-library/dom';
import { html, render, type TemplateResult } from 'lit';
import type { RemoteMarkDown } from './remote-markdown';
import './remote-markdown';

// toc-markdown.ts imports scrolling.ts, which imports header-toolbar.ts
// (for HEADER_HEIGHT) which imports the router and its routes.
vi.mock('../../router', () => ({
  router: { urlForName: vi.fn() },
}));

const fetchMock = vi.fn<typeof fetch>();
Object.defineProperty(globalThis, 'fetch', {
  configurable: true,
  writable: true,
  value: fetchMock,
});

// The shared `fixture` test helper requires at least one rendered child
// element, but a couple of this component's states (pending/error) render
// plain text with no elements, so render directly instead.
const renderRemoteMarkdown = async (template: TemplateResult) => {
  render(template, document.body);
  const element = document.body.firstElementChild as RemoteMarkDown;
  await element.updateComplete;
  return { element, shadowRoot: element.shadowRoot! };
};

describe('remote-markdown', () => {
  afterEach(() => {
    fetchMock.mockReset();
  });

  it('defines a component', () => {
    expect(customElements.get('remote-markdown')).toBeDefined();
  });

  it('fetches and renders the remote content as toc-markdown', async () => {
    fetchMock.mockResolvedValue(new Response('# Remote heading'));
    const { element, shadowRoot } = await renderRemoteMarkdown(
      html`<remote-markdown path="/content.md"></remote-markdown>`,
    );

    expect(fetchMock).toHaveBeenCalledWith('/content.md');
    await waitFor(() => {
      expect(shadowRoot.querySelector('toc-markdown')).toHaveProperty(
        'content',
        '# Remote heading',
      );
    });
    expect(element.path).toBe('/content.md');
  });

  it('renders an error message when the fetch fails', async () => {
    fetchMock.mockRejectedValue(new Error('network error'));
    const { shadowRoot } = await renderRemoteMarkdown(
      html`<remote-markdown path="/content.md"></remote-markdown>`,
    );

    await waitFor(() => {
      expect(shadowRoot).toHaveTextContent('Error loading content');
    });
  });

  it('renders an error when the path resolves to the HTML app shell', async () => {
    fetchMock.mockResolvedValue(
      new Response('<html></html>', { headers: { 'content-type': 'text/html' } }),
    );
    const { shadowRoot } = await renderRemoteMarkdown(
      html`<remote-markdown path="/missing.md"></remote-markdown>`,
    );

    await waitFor(() => {
      expect(shadowRoot).toHaveTextContent('Error loading content');
    });
  });

  it('renders an error when no path is provided', async () => {
    const { shadowRoot } = await renderRemoteMarkdown(html`<remote-markdown></remote-markdown>`);

    expect(fetchMock).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(shadowRoot).toHaveTextContent('Error loading content');
    });
  });
});
