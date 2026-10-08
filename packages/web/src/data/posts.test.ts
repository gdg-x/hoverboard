import { describe, expect, it } from 'vitest';
import type { Post } from '../models/post';
import { withPostSource } from './posts';

const post = (source?: string) => ({ id: 'c4p', title: 'Call for papers', source }) as Post;

describe('withPostSource', () => {
  it("uses the text of the site's post file", () => {
    expect(withPostSource(post('/data/posts/c4p.md'), { 'c4p.md': '# Talks' })).toEqual({
      ...post('/data/posts/c4p.md'),
      content: '# Talks',
    });
  });

  it('keeps the post when the site has no such file', () => {
    const item = post('/data/posts/missing.md');

    expect(withPostSource(item, { 'c4p.md': '# Talks' })).toBe(item);
  });

  it('keeps posts with another source or none for the browser to load', () => {
    const remote = post('https://example.com/c4p.md');
    const inline = post();

    expect(withPostSource(remote, { 'c4p.md': '# Talks' })).toBe(remote);
    expect(withPostSource(inline, { '': '# Talks' })).toBe(inline);
  });
});
