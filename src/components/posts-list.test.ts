import { describe, expect, it, jest } from '@jest/globals';
import { screen, within } from '@testing-library/dom';
import { mocked } from 'jest-mock';
import { html } from 'lit';
import { fixture } from '../../__tests__/helpers/fixtures';
import { Post } from '../models/post';
import { router } from '../router';
import './posts-list';

jest.mock('../router', () => ({
  router: { urlForName: jest.fn() },
}));

const mockUrlForName = mocked(router.urlForName);

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
    image: '',
    backgroundColor: '#000',
    published: '2024-02-01',
  },
];

describe('posts-list', () => {
  it('defines a component', () => {
    expect(customElements.get('posts-list')).toBeDefined();
  });

  it('renders a link for each post using the router', async () => {
    mockUrlForName.mockImplementation((_name, params) => `/blog/${(params as { id: string }).id}`);

    const { shadowRootForWithin } = await fixture(
      html`<posts-list data-testid="posts" .posts="${posts}"></posts-list>`,
    );
    const { getByText } = within(shadowRootForWithin);

    expect(screen.getByTestId('posts')).toBeInTheDocument();
    expect(getByText('First post')).toBeInTheDocument();
    expect(getByText('Second post')).toBeInTheDocument();

    const links = shadowRootForWithin.querySelectorAll('a.post');
    expect(links[0]).toHaveAttribute('href', '/blog/post-1');
    expect(links[1]).toHaveAttribute('href', '/blog/post-2');
  });

  it('hides the image for posts without one', async () => {
    const { shadowRootForWithin } = await fixture(
      html`<posts-list .posts="${posts}"></posts-list>`,
    );

    const images = shadowRootForWithin.querySelectorAll('lazy-image');
    expect(images[0]).not.toHaveAttribute('hidden');
    expect(images[1]).toHaveAttribute('hidden');
  });
});
