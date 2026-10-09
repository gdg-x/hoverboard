import { Initialized, Success } from '@abraham/remotedata';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { html } from 'lit';
import { fixture } from '../../../__tests__/helpers/fixtures';
import { setStoreState } from '../../../__tests__/helpers/store';
import type { Feedback } from '../../models/feedback';
import type { RootState } from '../../store';
import type { FeedbackBlock } from './feedback-block';

import './feedback-block';

afterEach(() => {
  vi.restoreAllMocks();
});

const feedback: Feedback = {
  id: 'user-id',
  userId: 'user-id',
  parentId: 'session-id',
  contentRating: 4,
  styleRating: 5,
  comment: 'Great session',
};

describe('feedback-block', () => {
  it('defines a component', () => {
    expect(customElements.get('feedback-block')).toBeDefined();
  });

  it('renders a rating input for content and style', async () => {
    const { shadowRoot } = await fixture<FeedbackBlock>(html`<feedback-block></feedback-block>`);

    const captions = shadowRoot.querySelectorAll('.caption');
    expect(captions[0]).toHaveTextContent('Content quality:');
    expect(captions[1]).toHaveTextContent('Presentation style:');
    expect(shadowRoot.querySelectorAll('star-rating')).toHaveLength(2);
  });

  it('hides the comment field and save button until a rating is given', async () => {
    const { element, shadowRoot } = await fixture<FeedbackBlock>(
      html`<feedback-block></feedback-block>`,
    );

    expect(shadowRoot.querySelector('hb-text-field')).toHaveAttribute('hidden');
    expect(shadowRoot.querySelector('hb-button')).toHaveAttribute('hidden');

    element.contentRating = 4;
    await element.updateComplete;

    expect(shadowRoot.querySelector('hb-text-field')).not.toHaveAttribute('hidden');
    expect(shadowRoot.querySelector('hb-button')).not.toHaveAttribute('hidden');
    expect(shadowRoot.querySelector('hb-text-field')).toHaveAttribute(
      'hint',
      'Comments will be anonymously provided to speakers',
    );
  });

  it('updates the rating when star-rating notifies a change', async () => {
    const { element, shadowRoot } = await fixture<FeedbackBlock>(
      html`<feedback-block></feedback-block>`,
    );

    const [content, style] = Array.from(shadowRoot.querySelectorAll('star-rating'));
    content?.dispatchEvent(new CustomEvent('rating-changed', { detail: { value: 3 } }));
    style?.dispatchEvent(new CustomEvent('rating-changed', { detail: { value: 2 } }));
    await element.updateComplete;

    expect(element.contentRating).toBe(3);
    expect(element.styleRating).toBe(2);
  });

  it('populates ratings and comment from saved feedback', async () => {
    const { element, shadowRoot } = await fixture<FeedbackBlock>(
      html`<feedback-block></feedback-block>`,
    );
    element.sessionId = 'session-id';
    setStoreState({
      user: new Initialized(),
      feedback: {
        data: new Success([feedback]),
        subscription: new Initialized(),
        set: new Initialized(),
        delete: new Initialized(),
      },
    } as unknown as Partial<RootState>);
    await element.updateComplete;

    expect(element.contentRating).toBe(feedback.contentRating);
    expect(element.styleRating).toBe(feedback.styleRating);
    expect(shadowRoot.querySelector('hb-text-field')!.value).toBe(feedback.comment);
    expect(shadowRoot.querySelector('.delete-button')).not.toHaveAttribute('hidden');
    expect(shadowRoot.querySelector('.thanks')).toHaveTextContent('Thanks for your feedback.');
    expect(shadowRoot.querySelector('.thanks .illustration')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
  });

  it('hides the delete button when there is no saved feedback', async () => {
    const { shadowRoot } = await fixture<FeedbackBlock>(html`<feedback-block></feedback-block>`);

    expect(shadowRoot.querySelector('.delete-button')).toHaveAttribute('hidden');
    expect(shadowRoot.querySelector('.delete-button')).toHaveTextContent('Delete');
  });
});
