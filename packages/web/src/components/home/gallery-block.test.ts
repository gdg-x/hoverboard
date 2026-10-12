import { Failure, Pending, Success } from '@abraham/remotedata';
import { screen } from 'shadow-dom-testing-library';
import { describe, expect, it, vi } from 'vitest';
import { html, nothing, render as litRender } from 'lit';
import { fixture } from '../../../__tests__/helpers/fixtures';
import { eventDates, galleryBlock } from '../../config/site';
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
    const { element, shadowRoot } = await fixture<GalleryBlock>(
      html`<gallery-block></gallery-block>`,
    );
    element.gallery = new Success([
      { id: 'photo-1', order: '1', url: 'https://example.com/photo-1.jpg' },
      { id: 'photo-2', order: '2', url: 'https://example.com/photo-2.jpg' },
    ]);
    await element.updateComplete;

    expect(screen.getAllByShadowAltText('Gallery photo')).toHaveLength(2);
    expect(shadowRoot).toHaveTextContent(galleryBlock.title);
    expect(screen.getByShadowRole('link', { name: 'See all photos' })).toHaveAttribute(
      'href',
      galleryBlock.callToAction.link,
    );
  });

  it('describes each photo with its alt text, or as a gallery photo without one', async () => {
    const { element } = await fixture<GalleryBlock>(html`<gallery-block></gallery-block>`);
    element.gallery = new Success([
      { id: 'a', order: '1', url: 'https://example.com/a.jpg', alt: 'Attendees at the keynote.' },
      { id: 'b', order: '2', url: 'https://example.com/b.jpg' },
    ]);
    await element.updateComplete;

    expect(screen.getByShadowAltText('Attendees at the keynote.')).toBeInTheDocument();
    expect(screen.getByShadowAltText('Gallery photo')).toBeInTheDocument();
  });

  it('says the photos are from past editions until this one is over', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(`${eventDates.end}T12:00:00Z`));
    const { shadowRoot } = await fixture<GalleryBlock>(html`<gallery-block></gallery-block>`);

    expect(shadowRoot.querySelector('.past-editions')).toHaveTextContent('From past editions');
    litRender(nothing, document.body);

    vi.setSystemTime(new Date(`${eventDates.end}T12:00:00Z`).getTime() + 2 * 86_400_000);
    const over = await fixture<GalleryBlock>(html`<gallery-block></gallery-block>`);
    vi.useRealTimers();

    expect(over.shadowRoot.querySelector('.past-editions')).toBeNull();
  });

  it('shows at most seven photos', async () => {
    const { element } = await fixture<GalleryBlock>(html`<gallery-block></gallery-block>`);
    element.gallery = new Success(
      Array.from({ length: 10 }, (_, index) => ({
        id: `photo-${index}`,
        order: String(index),
        url: `https://example.com/photo-${index}.jpg`,
      })),
    );
    await element.updateComplete;

    expect(screen.getAllByShadowAltText('Gallery photo')).toHaveLength(7);
  });

  it('triggers the fetch and starts in the pending state', async () => {
    const { element } = await fixture<GalleryBlock>(html`<gallery-block></gallery-block>`);

    expect(element.gallery).toBeInstanceOf(Pending);
  });
});
