import { Initialized, RemoteData, Success } from '@abraham/remotedata';
import { computed, customElement, observe, property } from '@polymer/decorators';
import '@polymer/paper-button';
import '@polymer/paper-input/paper-textarea';
import { html, PolymerElement } from '@polymer/polymer';
import '@radi-cho/star-rating';
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

@customElement('feedback-block')
export class FeedbackBlock extends ReduxMixin(PolymerElement) {
  static get template() {
    return html`
      <style>
        #feedback-comment {
          width: 100%;
        }

        star-rating,
        .caption {
          display: inline-block;
          vertical-align: bottom;
          --star-color: var(--default-primary-color);
        }

        paper-button {
          margin: 0;
          line-height: 1.4;
          border: 1px solid var(--default-primary-color);
        }

        paper-button[primary] {
          background-color: var(--default-primary-color);
          color: var(--text-primary-color);
        }

        paper-button.delete-button {
          color: var(--text-accent-color);
          padding: -2px;
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
      </style>

      <div class="container">
        <div>
          <div class="caption">[[feedbackText.contentCaption]]:</div>
          <star-rating rating="{{contentRating}}"></star-rating>
        </div>
        <div>
          <div class="caption">[[feedbackText.styleCaption]]:</div>
          <star-rating rating="{{styleRating}}"></star-rating>
        </div>

        <paper-textarea
          id="commentInput"
          hidden$="[[!hasRated]]"
          label="Comment"
          value="{{comment}}"
          maxlength="256"
        ></paper-textarea>
        <p hidden$="[[!hasRated]]" class="helper">[[feedbackText.helperText]]</p>
        <paper-button primary hidden$="[[!hasRated]]" on-click="setFeedback">
          [[feedbackText.save]]
        </paper-button>
        <paper-button class="delete-button" hidden$="[[!feedback.data]]" on-click="deleteFeedback">
          [[feedbackText.deleteFeedback]]
        </paper-button>
      </div>
    `;
  }

  @property({ type: Number })
  contentRating = 0;
  @property({ type: Number })
  styleRating = 0;
  @property({ type: String })
  sessionId: string | undefined;

  @property({ type: String })
  private comment = '';
  @property({ type: Object })
  private user = initialUserState;
  @property({ type: Object })
  private feedback: RemoteData<Error, Feedback | false> = new Initialized();

  private feedbackText = feedbackText;

  override stateChanged(state: RootState) {
    this.user = state.user;
    this.feedback = selectFeedbackById(state, this.sessionId);
  }

  private resetFeedback() {
    this.contentRating = 0;
    this.styleRating = 0;
    this.comment = '';
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
      })
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
        })
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
      })
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
        })
      );
    }
  }

  @observe('feedback')
  private onFeedback(feedback: SessionFeedback) {
    if (feedback instanceof Success && feedback.data) {
      this.contentRating = feedback.data.contentRating;
      this.styleRating = feedback.data.styleRating;
      this.comment = feedback.data.comment;
    } else {
      this.resetFeedback();
    }
  }

  @computed('contentRating', 'styleRating')
  get hasRated() {
    return (
      (this.contentRating > 0 && this.contentRating <= 5) ||
      (this.styleRating > 0 && this.styleRating <= 5)
    );
  }
}
