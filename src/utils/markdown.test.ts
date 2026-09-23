import { describe, expect, it } from 'vitest';
import { hasUnsupportedTags } from './markdown';

const parseFragment = (html: string): DocumentFragment => {
  const template = document.createElement('template');
  template.innerHTML = html;

  return template.content;
};

describe('hasUnsupportedTags', () => {
  it('returns true when the fragment contains a div', () => {
    expect(hasUnsupportedTags(parseFragment('<div>content</div>'))).toBe(true);
  });

  it('returns true when the fragment contains a plastic-image', () => {
    expect(hasUnsupportedTags(parseFragment('<plastic-image></plastic-image>'))).toBe(true);
  });

  it('returns false when the fragment has no unsupported tags', () => {
    expect(hasUnsupportedTags(parseFragment('<p>content</p>'))).toBe(false);
  });
});
