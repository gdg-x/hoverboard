import { afterEach, describe, expect, it } from 'vitest';
import { within } from '@testing-library/dom';
import { html, nothing, render as litRender } from 'lit';
import { fixture } from '../../../__tests__/helpers/fixtures';
import type { Post } from '../../models/post';
import './posts-list';

const posts: Post[] = [
  {
    id: 'post-1',
    title: 'First post',
    brief: 'First post brief',
    content: 'First post content',
    image: 'https://example.com/image-1.jpg',
    backgroundColor: '#fff',
    published: '2024-01-01',
  },
  {
    id: 'post-2',
    title: 'Second post',
    brief: '',
    content: 'Second post content',
    image: '',
    backgroundColor: '#000',
    published: '2024-02-01',
  },
];

describe('posts-list', () => {
  afterEach(() => {
    litRender(nothing, document.body);
  });

  it('shows each post as a card that links to it', async () => {
    const { shadowRoot, shadowRootForWithin } = await fixture(
      html`<posts-list .posts="${posts}"></posts-list>`,
    );
    const cards = shadowRoot.querySelectorAll('hb-card');

    expect(cards[0]).toHaveAttribute('href', '/blog/post-1');
    expect(cards[0]).toHaveAttribute('label', 'First post');
    expect(
      within(shadowRootForWithin)
        .getAllByRole('heading', { level: 2 })
        .map((h) => h.textContent),
    ).toEqual(['First post', 'Second post']);
    expect(shadowRoot.querySelector('.date')).toHaveTextContent('2024');
    expect(shadowRoot.querySelector('.brief')).toHaveProperty('content', 'First post brief');
  });

  it('leaves out the image and brief of posts without one', async () => {
    const { shadowRoot } = await fixture(html`<posts-list .posts="${posts}"></posts-list>`);
    const second = shadowRoot.querySelectorAll('.post')[1]!;

    expect(shadowRoot.querySelectorAll('img')).toHaveLength(1);
    expect(shadowRoot.querySelector('img')).toHaveAttribute('alt', '');
    expect(second.querySelector('.brief')).toBeNull();
  });

  it('can use h3 titles under a section heading', async () => {
    const { shadowRootForWithin } = await fixture(
      html`<posts-list heading-level="3" .posts="${posts}"></posts-list>`,
    );

    expect(within(shadowRootForWithin).getAllByRole('heading', { level: 3 })).toHaveLength(2);
  });

  it('marks the grid when the first post is featured', async () => {
    const { shadowRoot } = await fixture(
      html`<posts-list featured .posts="${posts}"></posts-list>`,
    );

    expect(shadowRoot.querySelector('ul')).toHaveClass('featured');
  });
});
