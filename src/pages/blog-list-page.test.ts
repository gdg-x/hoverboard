import { Failure, Initialized, Pending, Success } from '@abraham/remotedata';
import { describe, expect, it, jest } from '@jest/globals';
import { within } from '@testing-library/dom';
import { mocked } from 'jest-mock';
import { html } from 'lit';
import { fixture } from '../../__tests__/helpers/fixtures';
import { Post } from '../models/post';
import { router } from '../router';
import { fetchBlogPosts } from '../store/blog/actions';
import { heroSettings } from '../utils/data';
import { updateMetadata } from '../utils/metadata';
import './blog-list-page';
import { BlogListPage } from './blog-list-page';

jest.mock('../router', () => ({
  router: { urlForName: jest.fn() },
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
    content: 'First content',
    image: '/first.jpg',
    backgroundColor: '#111',
    published: '2024-01-01',
  },
  {
    id: 'post-2',
    title: 'Second post',
    brief: 'Second brief',
    content: 'Second content',
    image: '/second.jpg',
    backgroundColor: '#222',
    published: '2024-02-01',
  },
  {
    id: 'post-3',
    title: 'Third post',
    brief: 'Third brief',
    content: 'Third content',
    image: '/third.jpg',
    backgroundColor: '#333',
    published: '2024-03-01',
  },
  {
    id: 'post-4',
    title: 'Fourth post',
    brief: 'Fourth brief',
    content: 'Fourth content',
    image: '/fourth.jpg',
    backgroundColor: '#444',
    published: '2024-04-01',
  },
];

describe('blog-list-page', () => {
  it('defines a component', () => {
    expect(customElements.get('blog-list-page')).toBeDefined();
  });

  it('dispatches the fetch thunk and updates metadata', async () => {
    const mockFetchBlogPosts = mocked(fetchBlogPosts);
    const mockUpdateMetadata = mocked(updateMetadata);
    mockFetchBlogPosts.mockClear();
    mockUpdateMetadata.mockClear();

    const { element } = await fixture<BlogListPage>(html`<blog-list-page></blog-list-page>`);

    expect(element.posts).toBeInstanceOf(Initialized);
    expect(mockFetchBlogPosts).toHaveBeenCalled();
    expect(mockUpdateMetadata).toHaveBeenCalledWith(
      heroSettings.blog.title,
      heroSettings.blog.metaDescription,
    );
  });

  it('renders featured posts and passes the complete list to posts-list', async () => {
    mocked(router.urlForName).mockImplementation(
      (_name, params) => `/blog/${(params as { id: string }).id}`,
    );
    const { element, shadowRootForWithin } = await fixture<BlogListPage>(
      html`<blog-list-page></blog-list-page>`,
    );
    element.posts = new Success(posts);
    await element.updateComplete;

    const view = within(shadowRootForWithin);
    expect(view.getByText('First post')).toBeInTheDocument();
    expect(view.getByText('Third post')).toBeInTheDocument();
    expect(shadowRootForWithin.querySelectorAll('a.featured-post')).toHaveLength(3);
    expect(shadowRootForWithin.querySelector('a.featured-post')).toHaveAttribute(
      'href',
      '/blog/post-1',
    );

    const postsList = shadowRootForWithin.querySelector('posts-list');
    expect(postsList).toHaveProperty('posts', posts);
  });

  it('updates responsive truncation and loading visibility', async () => {
    const { element, shadowRoot } = await fixture<BlogListPage>(
      html`<blog-list-page></blog-list-page>`,
    );

    element.posts = new Pending();
    await element.updateComplete;
    expect(shadowRoot.querySelector('md-linear-progress')).not.toHaveAttribute('hidden');
    expect(shadowRoot.querySelector('content-loader')).not.toHaveAttribute('hidden');

    element.posts = new Success(posts);
    await element.updateComplete;
    expect(shadowRoot.querySelector('md-linear-progress')).toHaveAttribute('hidden');
    expect(shadowRoot.querySelectorAll('text-truncate')[1]).toHaveAttribute('lines', '2');
    expect(shadowRoot.querySelector('a.featured-post')).not.toHaveAttribute('flex');

    (element as unknown as { viewport: { isTabletPlus: boolean } }).viewport = {
      isTabletPlus: true,
    };
    await element.updateComplete;
    expect(shadowRoot.querySelectorAll('text-truncate')[1]).toHaveAttribute('lines', '3');
    expect(shadowRoot.querySelector('a.featured-post')).toHaveAttribute('flex');
  });

  it('renders the failure state and hides loaders', async () => {
    const { element, shadowRootForWithin } = await fixture<BlogListPage>(
      html`<blog-list-page></blog-list-page>`,
    );
    element.posts = new Failure(new Error('failed'));
    await element.updateComplete;

    expect(within(shadowRootForWithin).getByText('Error loading posts.')).toBeInTheDocument();
    expect(shadowRootForWithin.querySelector('md-linear-progress')).toHaveAttribute('hidden');
    expect(shadowRootForWithin.querySelector('content-loader')).toHaveAttribute('hidden');
  });
});
