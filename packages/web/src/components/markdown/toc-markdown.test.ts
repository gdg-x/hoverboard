import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, within } from '@testing-library/dom';
import { html, nothing, render as litRender } from 'lit';
import { fixture } from '../../../__tests__/helpers/fixtures';
import { scrollToElement } from '../../utils/scrolling';
import type { TocMarkdown } from './toc-markdown';
import './toc-markdown';

// Mocked, so the tests can check what the table of contents scrolls to.
vi.mock('../../utils/scrolling', () => ({
  scrollToElement: vi.fn(),
}));

const content = [
  '## Section One',
  '',
  '### Sub A',
  '',
  'Answer A.',
  '',
  '### Sub B',
  '',
  '## Section Two',
].join('\n');

describe('toc-markdown', () => {
  afterEach(() => {
    litRender(nothing, document.body);
    vi.mocked(scrollToElement).mockClear();
  });

  it('lists every h2 with its h3s in a table of contents', async () => {
    const { shadowRootForWithin } = await fixture<TocMarkdown>(
      html`<toc-markdown content="${content}" page-path="/faq"></toc-markdown>`,
    );
    const toc = within(shadowRootForWithin).getByRole('navigation', { name: 'On this page' });
    const links = within(toc).getAllByRole('link');

    expect(links.map((link) => link.textContent)).toEqual([
      'Section One',
      'Sub A',
      'Sub B',
      'Section Two',
    ]);
    expect(links[1]).toHaveAttribute('href', '/faq#sub-a');
  });

  it('renders the markdown as prose', async () => {
    const { shadowRoot } = await fixture<TocMarkdown>(
      html`<toc-markdown content="${content}"></toc-markdown>`,
    );

    expect(shadowRoot.querySelector('.prose h2')).toHaveTextContent('Section One');
    expect(shadowRoot.querySelector('details')).toBeNull();
  });

  it('shows each h3 as a disclosure with disclosures on', async () => {
    const { shadowRoot } = await fixture<TocMarkdown>(
      html`<toc-markdown content="${content}" disclosures></toc-markdown>`,
    );
    const disclosures = shadowRoot.querySelectorAll('details');

    expect(disclosures).toHaveLength(2);
    expect(disclosures[0]!.querySelector('summary h3')).toHaveTextContent('Sub A');
    expect(disclosures[0]).not.toHaveAttribute('open');
  });

  it('opens and scrolls to the linked question', async () => {
    const { shadowRoot } = await fixture<TocMarkdown>(
      html`<toc-markdown content="${content}" disclosures></toc-markdown>`,
    );
    const target = shadowRoot.querySelector('#sub-a')!;

    fireEvent.click(shadowRoot.querySelectorAll('.toc a')[1]!);

    expect(target.closest('details')).toHaveAttribute('open');
    expect(scrollToElement).toHaveBeenCalledWith(target);
  });

  it('scrolls to the header matching the location hash on connect', async () => {
    window.location.hash = '#sub-a';

    await fixture<TocMarkdown>(html`<toc-markdown content="${content}"></toc-markdown>`);

    expect(scrollToElement).toHaveBeenCalled();
    window.location.hash = '';
  });

  it('has no table of contents without headings', async () => {
    const { shadowRoot } = await fixture<TocMarkdown>(
      html`<toc-markdown content="Just a paragraph"></toc-markdown>`,
    );

    expect(shadowRoot.querySelector('.toc')).toBeNull();
  });
});
