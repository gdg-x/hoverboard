import { Failure, Pending, Success } from '@abraham/remotedata';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { waitFor, within } from '@testing-library/dom';
import { html } from 'lit';
import { fixture } from '../../__tests__/helpers/fixtures';
import type { Post } from '../models/post';
import { updateImageMetadata } from '../utils/metadata';
import { goto } from '../utils/navigation';
import './post-page';
import { PostPage } from './post-page';

vi.mock('../utils/metadata');
vi.mock('../utils/navigation', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../utils/navigation')>()),
  goto: vi.fn(),
}));
vi.mock('../utils/scrolling', () => ({
  scrollToTop: vi.fn(),
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
const fetchMock = vi.fn<typeof fetch>();
Object.defineProperty(globalThis, 'fetch', {
  configurable: true,
  writable: true,
  value: fetchMock,
});

describe('post-page', () => {
  afterEach(() => {
    fetchMock.mockReset();
  });

  it('defines a component and triggers the fetch, starting in the pending state', async () => {
    const { element } = await fixture<PostPage>(html`<post-page></post-page>`);

    expect(customElements.get('post-page')).toBeDefined();
    expect(element.posts).toBeInstanceOf(Pending);
  });

  it('synchronizes route data with posts and renders suggestions', async () => {
    const mockUpdateImageMetadata = vi.mocked(updateImageMetadata);
    mockUpdateImageMetadata.mockClear();
    const { element, shadowRootForWithin } = await fixture<PostPage>(html`<post-page></post-page>`);
    element.posts = new Success(posts);
    element.postId = 'post-1';
    await element.updateComplete;
    await element.updateComplete;

    const view = within(shadowRootForWithin);
    expect(view.getByRole('heading', { level: 1 })).toHaveTextContent('First post');
    expect(view.getByText(/Published: /)).toBeInTheDocument();
    expect(view.getByRole('heading', { level: 2, name: 'Up next' })).toBeInTheDocument();
    expect(view.getByRole('link', { name: 'All posts' })).toHaveAttribute('href', '/blog');
    expect(shadowRootForWithin.querySelector('long-markdown')).toHaveProperty(
      'content',
      'Inline first content',
    );
    expect(shadowRootForWithin.querySelector('.cover')).toHaveAttribute('src', '/first.jpg');
    expect(shadowRootForWithin.querySelector('.cover')).toHaveAttribute('alt', '');
    expect(shadowRootForWithin.querySelector('posts-list')).toHaveProperty(
      'posts',
      posts.slice(1, 4),
    );
    expect(shadowRootForWithin.querySelector('posts-list')).toHaveAttribute('heading-level', '3');
    expect(mockUpdateImageMetadata).toHaveBeenCalledWith('First post', 'First brief', {
      image: '/first.jpg',
      imageAlt: 'First post',
    });
  });

  it('loads remote content for the selected post', async () => {
    fetchMock.mockResolvedValue(new Response('Remote content'));
    const { element, shadowRoot } = await fixture<PostPage>(html`<post-page></post-page>`);
    element.posts = new Success([{ ...firstPost, source: '/post.md' }]);
    element.postId = 'post-1';
    await element.updateComplete;

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
    element.postId = 'post-1';
    await element.updateComplete;
    element.postId = 'post-2';
    await element.updateComplete;
    resolveFirst?.(new Response('Stale remote content'));
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
    element.postId = 'missing';
    await element.updateComplete;

    expect(goto).toHaveBeenCalledWith('/404');
  });

  it('stores a remote content fetch failure when the post has no inline content', async () => {
    fetchMock.mockRejectedValue(new Error('failed'));
    const { element } = await fixture<PostPage>(html`<post-page></post-page>`);
    element.posts = new Success([{ ...firstPost, content: '', source: '/post.md' }]);
    element.postId = 'post-1';

    await waitFor(() => {
      expect((element as unknown as { post: unknown }).post).toBeInstanceOf(Failure);
    });
  });

  it('keeps the inline content when the source resolves to the HTML app shell', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    fetchMock.mockResolvedValue(
      new Response('<html></html>', { headers: { 'content-type': 'text/html' } }),
    );
    const { element, shadowRoot } = await fixture<PostPage>(html`<post-page></post-page>`);
    element.posts = new Success([{ ...firstPost, source: '/missing.md' }]);
    element.postId = 'post-1';

    await waitFor(() => expect(error).toHaveBeenCalled());
    expect(shadowRoot.querySelector('long-markdown')).toHaveProperty(
      'content',
      'Inline first content',
    );
    error.mockRestore();
  });
});
