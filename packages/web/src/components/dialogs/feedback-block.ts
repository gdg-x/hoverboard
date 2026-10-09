import { type RemoteData, Success } from '@abraham/remotedata';
import { msg } from '@lit/localize';
import { css, html, type PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { fromStore } from '../../controllers/from-store';
import type { Feedback } from '../../models/feedback';
import { store } from '../../store';
import {
  deleteFeedback,
  selectFeedbackById,
  type SessionFeedback,
  setFeedback,
} from '../../store/feedback';
import { queueComplexSnackbar, queueSnackbar } from '../../store/snackbars';
import type { UserState } from '../../store/user';
import '../shared/star-rating';
import { type StarRatingChangeDetail } from '../shared/star-rating';
import '../ui/hb-button';
import '../ui/hb-text-field';
import type { HbTextField } from '../ui/hb-text-field';
import { ThemedElement } from '../themed-element';

@customElement('feedback-block')
export class FeedbackBlock extends ThemedElement {
  static override styles = css`
    .container {
      padding: var(--hb-space-6) var(--hb-space-4);
    }

    #commentInput {
      width: 100%;
    }

    star-rating,
    .caption {
      display: inline-block;
      vertical-align: bottom;
      --star-color: var(--hb-color-primary);
    }

    @media (min-width: 640px) {
      .caption {
        width: 25%;
      }
    }

    @media (max-width: 640px) {
      star-rating,
      .caption {
        display: block;
      }
    }
  `;

  @property({ type: Number })
  accessor contentRating = 0;
  @property({ type: Number })
  accessor styleRating = 0;
  @property({ type: String })
  accessor sessionId: string | undefined;

  @state()
  private accessor comment = '';
  @fromStore((state) => state.user)
  private accessor user!: UserState;
  @fromStore((state, host: FeedbackBlock) => selectFeedbackById(state, host.sessionId))
  private accessor feedback!: RemoteData<Error, Feedback | false>;

  override willUpdate(changedProperties: PropertyValues) {
    if (changedProperties.has('feedback')) {
      this.onFeedback(this.feedback);
    }
  }

  override render() {
    return html`
      <div class="container">
        <div>
          <div class="caption">
            ${msg('Content quality:', { id: 'dialogs.feedback.content-rating' })}
          </div>
          <star-rating
            .rating="${this.contentRating}"
            @rating-changed="${(event: CustomEvent<StarRatingChangeDetail>) =>
              this.onContentRatingChanged(event)}"
          ></star-rating>
        </div>
        <div>
          <div class="caption">
            ${msg('Presentation style:', { id: 'dialogs.feedback.style-rating' })}
          </div>
          <star-rating
            .rating="${this.styleRating}"
            @rating-changed="${(event: CustomEvent<StarRatingChangeDetail>) =>
              this.onStyleRatingChanged(event)}"
          ></star-rating>
        </div>

        <hb-text-field
          id="commentInput"
          type="textarea"
          ?hidden="${!this.hasRated}"
          label="${msg('Comment', { id: 'dialogs.feedback.comment' })}"
          hint="${msg('Comments will be anonymously provided to speakers', {
            id: 'dialogs.feedback.helper',
          })}"
          .value="${this.comment}"
          maxlength="256"
          @input="${(event: Event) => this.onCommentInput(event)}"
        ></hb-text-field>
        <hb-button ?hidden="${!this.hasRated}" @click="${() => this.setFeedback()}">
          ${msg('Save', { id: 'dialogs.feedback.save', desc: 'Saves the session review.' })}
        </hb-button>
        <hb-button
          variant="outlined"
          class="delete-button"
          ?hidden="${!this.hasSavedFeedback}"
          @click="${() => this.deleteFeedback()}"
        >
          ${msg('Delete', { id: 'dialogs.feedback.delete', desc: 'Deletes the session review.' })}
        </hb-button>
      </div>
    `;
  }

  private onCommentInput(e: Event) {
    this.comment = (e.target as HbTextField).value;
  }

  private resetFeedback() {
    this.contentRating = 0;
    this.styleRating = 0;
    this.comment = '';
  }

  private onContentRatingChanged(event: CustomEvent<StarRatingChangeDetail>) {
    this.contentRating = event.detail.value;
  }

  private onStyleRatingChanged(event: CustomEvent<StarRatingChangeDetail>) {
    this.styleRating = event.detail.value;
  }

  private async setFeedback() {
    if (!(this.user instanceof Success)) {
      store.dispatch(
        queueSnackbar(msg('Sign in to leave feedback', { id: 'dialogs.feedback.save-signed-out' })),
      );
      return;
    }
    if (!this.sessionId) {
      return;
    }

    const resultAction = await store.dispatch(
      setFeedback({
        id: this.user.data.uid,
        userId: this.user.data.uid,
        parentId: this.sessionId,
        contentRating: this.contentRating,
        styleRating: this.styleRating,
        comment: this.comment || '',
      }),
    );

    if (setFeedback.fulfilled.match(resultAction)) {
      store.dispatch(queueSnackbar(msg('Feedback saved', { id: 'dialogs.feedback.saved' })));
    } else {
      store.dispatch(
        queueComplexSnackbar({
          label: this.errorMessage(),
          action: {
            title: this.retryLabel(),
            callback: () => this.setFeedback(),
          },
        }),
      );
    }
  }

  private async deleteFeedback() {
    if (!(this.user instanceof Success)) {
      store.dispatch(
        queueSnackbar(
          msg('Sign in to delete feedback', { id: 'dialogs.feedback.delete-signed-out' }),
        ),
      );
      return;
    }
    if (!this.sessionId) {
      return;
    }

    const resultAction = await store.dispatch(
      deleteFeedback({
        parentId: this.sessionId,
        userId: this.user.data.uid,
        id: this.user.data.uid,
      }),
    );

    if (deleteFeedback.fulfilled.match(resultAction)) {
      store.dispatch(queueSnackbar(msg('Feedback deleted', { id: 'dialogs.feedback.deleted' })));
    } else {
      store.dispatch(
        queueComplexSnackbar({
          label: this.errorMessage(),
          action: {
            title: this.retryLabel(),
            callback: () => this.deleteFeedback(),
          },
        }),
      );
    }
  }

  private errorMessage() {
    return msg('Something went wrong', { id: 'dialogs.feedback.error' });
  }

  private retryLabel() {
    return msg('Retry', { id: 'dialogs.feedback.retry' });
  }

  private onFeedback(feedback: SessionFeedback) {
    if (feedback instanceof Success && feedback.data) {
      this.contentRating = feedback.data.contentRating;
      this.styleRating = feedback.data.styleRating;
      this.comment = feedback.data.comment;
    } else {
      this.resetFeedback();
    }
  }

  private get hasSavedFeedback() {
    return this.feedback instanceof Success && Boolean(this.feedback.data);
  }

  private get hasRated() {
    return (
      (this.contentRating > 0 && this.contentRating <= 5) ||
      (this.styleRating > 0 && this.styleRating <= 5)
    );
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'feedback-block': FeedbackBlock;
  }
}
