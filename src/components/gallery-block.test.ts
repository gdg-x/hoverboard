import { Failure, Initialized, Pending, Success } from '@abraham/remotedata';
import { describe, expect, it, jest } from '@jest/globals';
import { mocked } from 'jest-mock';
import { html } from 'lit';
import { fixture } from '../../__tests__/helpers/fixtures';
import { fetchGallery } from '../store/gallery/actions';
import { galleryBlock } from '../utils/data';
import type { GalleryBlock } from './gallery-block';
import './gallery-block';

jest.mock('../store/gallery/actions', () => ({
  fetchGallery: jest.fn(),
}));

const mockFetchGallery = mocked(fetchGallery);

describe('gallery-block', () => {
  it('defines a component', () => {
    expect(customElements.get('gallery-block')).toBeDefined();
  });

  it('renders the loading state', async () => {
    const { element, shadowRoot } = await fixture<GalleryBlock>(
      html`<gallery-block></gallery-block>`,
    );
    element.gallery = new Pending();
    await element.updateComplete;

    expect(shadowRoot).toHaveTextContent('Loading...');
  });

  it('renders the error state', async () => {
    const { element, shadowRoot } = await fixture<GalleryBlock>(
      html`<gallery-block></gallery-block>`,
    );
    element.gallery = new Failure(new Error('failed'));
    await element.updateComplete;

    expect(shadowRoot).toHaveTextContent('Error loading gallery.');
  });

  it('renders photos and gallery CTA on success', async () => {
    const { element, shadowRoot } = await fixture<GalleryBlock>(
      html`<gallery-block></gallery-block>`,
    );
    element.gallery = new Success([
      { id: 'photo-1', order: '1', url: 'https://example.com/photo-1.jpg' },
      { id: 'photo-2', order: '2', url: 'https://example.com/photo-2.jpg' },
    ]);
    await element.updateComplete;

    expect(shadowRoot.querySelectorAll('lazy-image')).toHaveLength(2);
    expect(shadowRoot).toHaveTextContent(galleryBlock.title);
    expect(shadowRoot.querySelector('.gallery-info a')).toHaveAttribute(
      'href',
      galleryBlock.callToAction.link,
    );
  });

  it('dispatches the gallery fetch thunk from the initialized state', async () => {
    mockFetchGallery.mockClear();
    const { element } = await fixture<GalleryBlock>(html`<gallery-block></gallery-block>`);

    expect(element.gallery).toBeInstanceOf(Initialized);
    expect(mockFetchGallery).toHaveBeenCalled();
  });
});
