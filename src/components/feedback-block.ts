import { Initialized, RemoteData, Success } from '@abraham/remotedata';
import '@material/web/button/filled-button.js';
import '@material/web/button/outlined-button.js';
import '@material/web/textfield/outlined-text-field.js';
import { MdOutlinedTextField } from '@material/web/textfield/outlined-text-field.js';
import { css, html, PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { Feedback } from '../models/feedback';
import { RootState, store } from '../store';
import {
  deleteFeedback,
  selectFeedbackById,
  SessionFeedback,
  setFeedback,
} from '../store/feedback';
import { ReduxMixin } from '../store/mixin';
import { queueComplexSnackbar, queueSnackbar } from '../store/snackbars';
import { initialUserState } from '../store/user/state';
import { feedback as feedbackText } from '../utils/data';
import './star-rating';
import { type StarRatingChangeDetail } from './star-rating';
import { ThemedElement } from './themed-element';

@customElement('feedback-block')
export class FeedbackBlock extends ReduxMixin(ThemedElement) {
  static override get styles() {
    return [
      ...super.styles,
      css`
        #feedback-comment {
          width: 100%;
        }

        md-outlined-text-field {
          width: 100%;
        }

        star-rating,
        .caption {
          display: inline-block;
          vertical-align: bottom;
          --star-color: var(--default-primary-color);
        }

        .helper {
          font-size: 12px;
          line-height: 1;
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
      `,
    ];
  }

  @property({ type: Number })
  contentRating = 0;
  @property({ type: Number })
  styleRating = 0;
  @property({ type: String })
  sessionId: string | undefined;

  @state()
  private comment = '';
  @state()
  private user = initialUserState;
  @state()
  private feedback: RemoteData<Error, Feedback | false> = new Initialized();

  private feedbackText = feedbackText;

  override stateChanged(state: RootState) {
    this.user = state.user;
    this.feedback = selectFeedbackById(state, this.sessionId);
  }

  override willUpdate(changedProperties: PropertyValues) {
    if (changedProperties.has('feedback')) {
      this.onFeedback(this.feedback);
    }
  }

  override render() {
    return html`
      <div class="container">
        <div>
          <div class="caption">${this.feedbackText.contentCaption}:</div>
          <star-rating
            .rating="${this.contentRating}"
            @rating-changed="${(event: CustomEvent<StarRatingChangeDetail>) =>
              this.onContentRatingChanged(event)}"
          ></star-rating>
        </div>
        <div>
          <div class="caption">${this.feedbackText.styleCaption}:</div>
          <star-rating
            .rating="${this.styleRating}"
            @rating-changed="${(event: CustomEvent<StarRatingChangeDetail>) =>
              this.onStyleRatingChanged(event)}"
          ></star-rating>
        </div>

        <md-outlined-text-field
          id="commentInput"
          type="textarea"
          ?hidden="${!this.hasRated}"
          label="Comment"
          .value="${this.comment}"
          maxlength="256"
          @input="${(event: Event) => this.onCommentInput(event)}"
        ></md-outlined-text-field>
        <p ?hidden="${!this.hasRated}" class="helper">${this.feedbackText.helperText}</p>
        <md-filled-button
          class="primary"
          ?hidden="${!this.hasRated}"
          @click="${() => this.setFeedback()}"
        >
          ${this.feedbackText.save}
        </md-filled-button>
        <md-outlined-button
          class="delete-button"
          ?hidden="${!this.hasSavedFeedback}"
          @click="${() => this.deleteFeedback()}"
        >
          ${this.feedbackText.deleteFeedback}
        </md-outlined-button>
      </div>
    `;
  }

  private onCommentInput(e: Event) {
    this.comment = (e.target as MdOutlinedTextField).value;
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
      store.dispatch(queueSnackbar(feedbackText.sendFeedbackSignedOut));
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
      store.dispatch(queueSnackbar(feedbackText.feedbackRecorded));
    } else {
      store.dispatch(
        queueComplexSnackbar({
          label: feedbackText.somethingWentWrong,
          action: {
            title: 'Retry',
            callback: () => this.setFeedback(),
          },
        }),
      );
    }
  }

  private async deleteFeedback() {
    if (!(this.user instanceof Success)) {
      store.dispatch(queueSnackbar(feedbackText.removeFeedbackSignedOut));
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
      store.dispatch(queueSnackbar(feedbackText.feedbackDeleted));
    } else {
      store.dispatch(
        queueComplexSnackbar({
          label: feedbackText.somethingWentWrong,
          action: {
            title: 'Retry',
            callback: () => this.deleteFeedback(),
          },
        }),
      );
    }
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
