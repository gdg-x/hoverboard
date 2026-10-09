import { describe, expect, it, vi } from 'vitest';
import { renderMarkdown, renderMarkdownWithHeadings, withDisclosures } from './markdown';

describe('renderMarkdown', () => {
  it('renders markdown to HTML', () => {
    expect(renderMarkdown('Some **bold** text')).toBe('<p>Some <strong>bold</strong> text</p>\n');
  });

  it('opens links in a new tab', () => {
    expect(renderMarkdown('[link](https://example.com)')).toBe(
      '<p><a href="https://example.com" target="_blank" rel="noopener noreferrer">link</a></p>\n',
    );
  });

  it('removes scripts', () => {
    expect(renderMarkdown('<script>window.xss = 1</script>text')).not.toContain('script');
  });

  it.each(['<div>content</div>', '<plastic-image></plastic-image>'])(
    'warns about unsupported tags in %s',
    (content) => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

      renderMarkdown(content);

      expect(warn).toHaveBeenCalledWith(
        'Invalid Markdown contains some of the following tags: div, plastic-image',
      );
      warn.mockRestore();
    },
  );

  it('does not warn about supported tags', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    renderMarkdown('<p>content</p>');

    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });
});

describe('renderMarkdownWithHeadings', () => {
  it('gives each heading as plain text, with its symbols', () => {
    const { headings } = renderMarkdownWithHeadings(
      '## Livestream & Recordings\n\n### Ticket `types` *now*',
    );

    expect(headings).toEqual([
      { id: 'livestream--recordings', level: 2, text: 'Livestream & Recordings' },
      { id: 'ticket-types-now', level: 3, text: 'Ticket types now' },
    ]);
  });
});

describe('withDisclosures', () => {
  it('wraps each h3 and its answer in a disclosure, and keeps h2 sections open', () => {
    const html = withDisclosures(
      renderMarkdown('## Venue\n\nIntro.\n\n### Parking\n\nNearby.\n\n- One\n\n### Food\n\nYes.'),
    );
    const doc = new DOMParser().parseFromString(html, 'text/html');

    const text = (selector: string, root: ParentNode = doc) =>
      root.querySelector(selector)?.textContent?.replace(/\s+/g, ' ').trim();

    expect(doc.body.firstElementChild?.outerHTML).toBe('<h2 id="venue">Venue</h2>');
    expect(text('body > p')).toBe('Intro.');
    const disclosures = doc.querySelectorAll('details');
    expect(disclosures).toHaveLength(2);
    expect(text('summary > h3#parking', disclosures[0])).toBe('Parking');
    expect(text('.answer', disclosures[0])).toBe('Nearby. One');
    expect(text('.answer', disclosures[1])).toBe('Yes.');
  });

  it('leaves markdown without h3 headings alone', () => {
    const html = renderMarkdown('## Rules\n\nBe kind.');

    expect(withDisclosures(html)).toBe(html);
  });
});
