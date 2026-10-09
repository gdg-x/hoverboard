import { Failure, Pending, Success } from '@abraham/remotedata';
import { within } from '@testing-library/dom';
import { describe, expect, it } from 'vitest';
import { html } from 'lit';
import { fixture } from '../../../__tests__/helpers/fixtures';
import { galleryBlock } from '../../config/site';
import type { GalleryBlock } from './gallery-block';
import './gallery-block';

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
    const { element, shadowRoot, shadowRootForWithin } = await fixture<GalleryBlock>(
      html`<gallery-block></gallery-block>`,
    );
    element.gallery = new Success([
      { id: 'photo-1', order: '1', url: 'https://example.com/photo-1.jpg' },
      { id: 'photo-2', order: '2', url: 'https://example.com/photo-2.jpg' },
    ]);
    await element.updateComplete;

    expect(within(shadowRootForWithin).getAllByAltText('Gallery photo')).toHaveLength(2);
    expect(shadowRoot).toHaveTextContent(galleryBlock.title);
    expect(shadowRoot.querySelector('.band-header hb-button')).toHaveAttribute(
      'href',
      galleryBlock.callToAction.link,
    );
  });

  it('shows at most seven photos', async () => {
    const { element, shadowRoot } = await fixture<GalleryBlock>(
      html`<gallery-block></gallery-block>`,
    );
    element.gallery = new Success(
      Array.from({ length: 10 }, (_, index) => ({
        id: `photo-${index}`,
        order: String(index),
        url: `https://example.com/photo-${index}.jpg`,
      })),
    );
    await element.updateComplete;

    expect(shadowRoot.querySelectorAll('.photo')).toHaveLength(7);
  });

  it('triggers the fetch and starts in the pending state', async () => {
    const { element } = await fixture<GalleryBlock>(html`<gallery-block></gallery-block>`);

    expect(element.gallery).toBeInstanceOf(Pending);
  });
});
