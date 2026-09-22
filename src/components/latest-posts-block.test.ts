import { Initialized, Success } from '@abraham/remotedata';
import { describe, expect, it, jest } from '@jest/globals';
import { mocked } from 'jest-mock';
import { html } from 'lit';
import { fixture } from '../../__tests__/helpers/fixtures';
import { Post } from '../models/post';
import { router } from '../router';
import { fetchBlogPosts } from '../store/blog/actions';
import { latestPostsBlock } from '../utils/data';
import type { LatestPostsBlock } from './latest-posts-block';
import './latest-posts-block';

jest.mock('../router', () => ({
  router: { urlForName: jest.fn() },
}));

jest.mock('../store/blog/actions', () => ({
  fetchBlogPosts: jest.fn(),
}));

const mockUrlForName = mocked(router.urlForName);
const mockFetchBlogPosts = mocked(fetchBlogPosts);

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
    brief: 'Second post brief',
    content: 'Second post content',
    image: 'https://example.com/image-2.jpg',
    backgroundColor: '#000',
    published: '2024-02-01',
  },
];

describe('latest-posts-block', () => {
  it('defines a component', () => {
    expect(customElements.get('latest-posts-block')).toBeDefined();
  });

  it('dispatches the blog fetch thunk from the initialized state', async () => {
    mockFetchBlogPosts.mockClear();
    const { element } = await fixture<LatestPostsBlock>(
      html`<latest-posts-block></latest-posts-block>`,
    );

    expect(element.posts).toBeInstanceOf(Initialized);
    expect(mockFetchBlogPosts).toHaveBeenCalled();
  });

  it('renders up to four latest posts using the router', async () => {
    mockUrlForName.mockImplementation((_name, params) => `/blog/${(params as { id: string }).id}`);

    const { element, shadowRoot } = await fixture<LatestPostsBlock>(
      html`<latest-posts-block data-testid="block"></latest-posts-block>`,
    );
    element.posts = new Success(posts);
    await element.updateComplete;

    expect(shadowRoot).toHaveTextContent(latestPostsBlock.title);
    const links = shadowRoot.querySelectorAll('a.post');
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute('href', '/blog/post-1');
    expect(links[1]).toHaveAttribute('href', '/blog/post-2');
    expect(shadowRoot.querySelector('.cta-button')).toHaveTextContent(
      latestPostsBlock.callToAction.label,
    );
    expect(shadowRoot.querySelector('.cta-button')).toHaveAttribute('trailing-icon');
    expect(shadowRoot.querySelector('.cta-button hoverboard-icon')).toHaveAttribute('slot', 'icon');
  });
});
