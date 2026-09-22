import { Failure, Initialized, Success } from '@abraham/remotedata';
import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { waitFor, within } from '@testing-library/dom';
import { mocked } from 'jest-mock';
import { html } from 'lit';
import { fixture } from '../../__tests__/helpers/fixtures';
import { Post } from '../models/post';
import { router } from '../router';
import { fetchBlogPosts } from '../store/blog/actions';
import { updateImageMetadata } from '../utils/metadata';
import './post-page';
import { PostPage } from './post-page';

jest.mock('../router', () => ({
  router: {
    render: jest.fn(),
    urlForName: jest.fn(),
  },
}));
jest.mock('../store/blog/actions', () => ({
  fetchBlogPosts: jest.fn(),
}));
jest.mock('../utils/metadata');
jest.mock('../utils/scrolling', () => ({
  scrollToTop: jest.fn(),
}));

const posts: Post[] = [
  {
    id: 'post-1',
    title: 'First post',
    brief: 'First brief',
    content: 'Inline first content',
    image: '/first.jpg',
    backgroundColor: '#111',
    published: '2024-01-01',
  },
  {
    id: 'post-2',
    title: 'Second post',
    brief: 'Second brief',
    content: 'Inline second content',
    image: '/second.jpg',
    backgroundColor: '#222',
    published: '2024-02-01',
  },
  {
    id: 'post-3',
    title: 'Third post',
    brief: 'Third brief',
    content: 'Inline third content',
    image: '/third.jpg',
    backgroundColor: '#333',
    published: '2024-03-01',
  },
  {
    id: 'post-4',
    title: 'Fourth post',
    brief: 'Fourth brief',
    content: 'Inline fourth content',
    image: '/fourth.jpg',
    backgroundColor: '#444',
    published: '2024-04-01',
  },
];

const firstPost = posts[0]!;
const secondPost = posts[1]!;
const firstPostWithPrimaryColor = {
  ...firstPost,
  primaryColor: '#abc',
} as Post & { primaryColor: string };
const fetchMock = jest.fn<typeof fetch>();
Object.defineProperty(globalThis, 'fetch', {
  configurable: true,
  writable: true,
  value: fetchMock,
});

describe('post-page', () => {
  afterEach(() => {
    fetchMock.mockReset();
  });

  it('defines a component and dispatches the fetch thunk', async () => {
    const mockFetchBlogPosts = mocked(fetchBlogPosts);
    mockFetchBlogPosts.mockClear();

    const { element } = await fixture<PostPage>(html`<post-page></post-page>`);

    expect(customElements.get('post-page')).toBeDefined();
    expect(element.posts).toBeInstanceOf(Initialized);
    expect(mockFetchBlogPosts).toHaveBeenCalled();
  });

  it('synchronizes route data with posts and renders suggestions', async () => {
    const mockUpdateImageMetadata = mocked(updateImageMetadata);
    mockUpdateImageMetadata.mockClear();
    mocked(router.urlForName).mockImplementation(
      (_name, params) => `/blog/${(params as { id: string }).id}`,
    );
    const { element, shadowRootForWithin } = await fixture<PostPage>(html`<post-page></post-page>`);
    element.posts = new Success([firstPostWithPrimaryColor, ...posts.slice(1)]);
    element.onAfterEnter({ params: { id: 'post-1' } } as never);
    await element.updateComplete;

    const view = within(shadowRootForWithin);
    expect(view.getByText('First post')).toBeInTheDocument();
    expect(shadowRootForWithin.querySelector('long-markdown')).toHaveProperty(
      'content',
      'Inline first content',
    );
    expect(shadowRootForWithin.querySelector('hero-block')).toHaveProperty(
      'backgroundColor',
      '#abc',
    );
    expect(shadowRootForWithin.querySelector('posts-list')).toHaveProperty(
      'posts',
      posts.slice(1, 4),
    );
    expect(mockUpdateImageMetadata).toHaveBeenCalledWith('First post', 'First brief', {
      image: '/first.jpg',
      imageAlt: 'First post',
    });
  });

  it('loads remote content for the selected post', async () => {
    fetchMock.mockResolvedValue({ text: async () => 'Remote content' } as Response);
    const { element, shadowRoot } = await fixture<PostPage>(html`<post-page></post-page>`);
    element.posts = new Success([{ ...firstPost, source: '/post.md' }]);
    element.onAfterEnter({ params: { id: 'post-1' } } as never);

    expect(fetchMock).toHaveBeenCalledWith('/post.md');
    await waitFor(() => {
      expect(shadowRoot.querySelector('long-markdown')).toHaveProperty('content', 'Remote content');
    });
  });

  it('keeps newer navigation content when an older fetch finishes', async () => {
    let resolveFirst: ((value: Response) => void) | undefined;
    fetchMock.mockImplementation(
      () =>
        new Promise<Response>((resolve) => {
          resolveFirst = resolve;
        }),
    );
    const { element, shadowRoot } = await fixture<PostPage>(html`<post-page></post-page>`);
    element.posts = new Success([{ ...firstPost, source: '/post.md' }, secondPost]);
    element.onAfterEnter({ params: { id: 'post-1' } } as never);
    element.onAfterEnter({ params: { id: 'post-2' } } as never);
    resolveFirst?.({ text: async () => 'Stale remote content' } as Response);
    await Promise.resolve();
    await Promise.resolve();
    await element.updateComplete;

    expect(shadowRoot.querySelector('long-markdown')).toHaveProperty(
      'content',
      'Inline second content',
    );
  });

  it('renders the 404 route when the requested post is missing', async () => {
    const { element } = await fixture<PostPage>(html`<post-page></post-page>`);
    element.posts = new Success(posts);
    element.onAfterEnter({ params: { id: 'missing' } } as never);

    expect(router.render).toHaveBeenCalledWith('/404');
  });

  it('stores a remote content fetch failure', async () => {
    fetchMock.mockRejectedValue(new Error('failed'));
    const { element } = await fixture<PostPage>(html`<post-page></post-page>`);
    element.posts = new Success([{ ...firstPost, source: '/post.md' }]);
    element.onAfterEnter({ params: { id: 'post-1' } } as never);

    await waitFor(() => {
      expect((element as unknown as { post: unknown }).post).toBeInstanceOf(Failure);
    });
  });
});
