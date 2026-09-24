import { describe, expect, it, vi } from 'vitest';
import { fireEvent, within } from '@testing-library/dom';
import { html } from 'lit';
import { fixture } from '../../__tests__/helpers/fixtures';
import { type StarRating, type StarRatingChangeDetail } from './star-rating';
import './star-rating';

const getButtons = (shadowRootForWithin: HTMLElement) =>
  within(shadowRootForWithin).getAllByRole('button') as HTMLButtonElement[];

const getButton = (shadowRootForWithin: HTMLElement, index: number) => {
  const button = getButtons(shadowRootForWithin)[index];
  if (!button) {
    throw new Error(`Expected star button at index ${index}`);
  }

  return button;
};

describe('star-rating', () => {
  it('defines a component and renders five interactive stars', async () => {
    const { shadowRootForWithin } = await fixture<StarRating>(html`<star-rating></star-rating>`);

    expect(customElements.get('star-rating')).toBeDefined();
    expect(getButtons(shadowRootForWithin)).toHaveLength(5);
  });

  it('renders the current rating as selected stars', async () => {
    const { shadowRootForWithin } = await fixture<StarRating>(
      html`<star-rating .rating="${3}"></star-rating>`,
    );
    const buttons = getButtons(shadowRootForWithin);

    expect(buttons.map((button) => button.getAttribute('aria-pressed'))).toEqual([
      'true',
      'true',
      'true',
      'false',
      'false',
    ]);
  });

  it('updates the rating when a star is clicked', async () => {
    const { element, shadowRootForWithin } = await fixture<StarRating>(
      html`<star-rating></star-rating>`,
    );

    fireEvent.click(getButton(shadowRootForWithin, 3));
    await element.updateComplete;

    expect(element.rating).toBe(4);
    expect(getButton(shadowRootForWithin, 3)).toHaveAttribute('aria-pressed', 'true');
  });

  it('dispatches a Polymer-compatible rating-changed event detail', async () => {
    const { element, shadowRootForWithin } = await fixture<StarRating>(
      html`<star-rating></star-rating>`,
    );
    const ratingChanged = vi.fn();
    const events: CustomEvent<StarRatingChangeDetail>[] = [];

    element.addEventListener('rating-changed', (event) => {
      ratingChanged();
      events.push(event as CustomEvent<StarRatingChangeDetail>);
    });
    fireEvent.click(getButton(shadowRootForWithin, 1));

    expect(ratingChanged).toHaveBeenCalledTimes(1);
    expect(events[0]?.detail).toEqual({ rating: 2, value: 2 });
  });

  it('supports keyboard rating changes', async () => {
    const { element, shadowRootForWithin } = await fixture<StarRating>(
      html`<star-rating .rating="${2}"></star-rating>`,
    );

    fireEvent.keyDown(getButton(shadowRootForWithin, 1), { key: 'ArrowRight' });
    await element.updateComplete;
    expect(element.rating).toBe(3);

    fireEvent.keyDown(getButton(shadowRootForWithin, 2), { key: 'ArrowLeft' });
    await element.updateComplete;
    expect(element.rating).toBe(2);

    fireEvent.keyDown(getButton(shadowRootForWithin, 4), { key: 'Enter' });
    await element.updateComplete;
    expect(element.rating).toBe(5);
  });

  it('clamps invalid and out-of-bounds rating values', async () => {
    const { element, shadowRootForWithin } = await fixture<StarRating>(
      html`<star-rating .rating="${8}"></star-rating>`,
    );

    expect(element.rating).toBe(5);
    expect(
      getButtons(shadowRootForWithin).every(
        (button) => button.getAttribute('aria-pressed') === 'true',
      ),
    ).toBe(true);

    element.rating = -1;
    await element.updateComplete;
    expect(element.rating).toBe(0);

    element.rating = Number.NaN;
    await element.updateComplete;
    expect(element.rating).toBe(0);
  });
});
