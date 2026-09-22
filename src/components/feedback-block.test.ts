import { Initialized, Success } from '@abraham/remotedata';
import { describe, expect, it } from '@jest/globals';
import { html } from 'lit';
import { fixture } from '../../__tests__/helpers/fixtures';
import { Feedback } from '../models/feedback';
import { RootState } from '../store';
import { feedback as feedbackText } from '../utils/data';
import type { FeedbackBlock } from './feedback-block';

import './feedback-block';

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
    expect(captions[0]).toHaveTextContent(feedbackText.contentCaption);
    expect(captions[1]).toHaveTextContent(feedbackText.styleCaption);
    expect(shadowRoot.querySelectorAll('star-rating')).toHaveLength(2);
  });

  it('hides the comment field and save button until a rating is given', async () => {
    const { element, shadowRoot } = await fixture<FeedbackBlock>(
      html`<feedback-block></feedback-block>`,
    );

    expect(shadowRoot.querySelector('md-outlined-text-field')).toHaveAttribute('hidden');
    expect(shadowRoot.querySelector('md-filled-button')).toHaveAttribute('hidden');

    element.contentRating = 4;
    await element.updateComplete;

    expect(shadowRoot.querySelector('md-outlined-text-field')).not.toHaveAttribute('hidden');
    expect(shadowRoot.querySelector('md-filled-button')).not.toHaveAttribute('hidden');
    expect(shadowRoot.querySelector('.helper')).toHaveTextContent(feedbackText.helperText);
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
    element.stateChanged({
      user: new Initialized(),
      feedback: {
        data: new Success([feedback]),
        subscription: new Initialized(),
        set: new Initialized(),
        delete: new Initialized(),
      },
    } as unknown as RootState);
    await element.updateComplete;

    expect(element.contentRating).toBe(feedback.contentRating);
    expect(element.styleRating).toBe(feedback.styleRating);
    expect(shadowRoot.querySelector('md-outlined-text-field')).toHaveValue(feedback.comment);
    expect(shadowRoot.querySelector('.delete-button')).not.toHaveAttribute('hidden');
  });

  it('hides the delete button when there is no saved feedback', async () => {
    const { shadowRoot } = await fixture<FeedbackBlock>(html`<feedback-block></feedback-block>`);

    expect(shadowRoot.querySelector('.delete-button')).toHaveAttribute('hidden');
    expect(shadowRoot.querySelector('.delete-button')).toHaveTextContent(
      feedbackText.deleteFeedback,
    );
  });
});
