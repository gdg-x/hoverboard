import { describe, expect, it, vi } from 'vitest';
import { renderMarkdown } from './markdown';

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
