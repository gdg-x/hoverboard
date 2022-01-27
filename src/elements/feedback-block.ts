import { Initialized, RemoteData, Success } from '@abraham/remotedata';
import { computed, customElement, observe, property } from '@polymer/decorators';
import '@polymer/paper-button';
import '@polymer/paper-input/paper-textarea';
import { html, PolymerElement } from '@polymer/polymer';
import '@radi-cho/star-rating';
import { ReduxMixin } from '../mixins/redux-mixin';
import { Feedback } from '../models/feedback';
import { RootState, store } from '../store';
import {
  initialState,
  removeFeedback,
  selectFeedbackById,
  selectRemoveFeedback,
  selectSetFeedback,
  selectSubscription,
  setFeedback,
} from '../store/feedback';
import { queueComplexSnackbar, queueSnackbar } from '../store/snackbars';
import { initialUserState } from '../store/user/state';

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
          <div class="caption">{$ feedback.contentCaption $}:</div>
          <star-rating rating="{{contentRating}}"></star-rating>
        </div>
        <div>
          <div class="caption">{$ feedback.styleCaption $}:</div>
          <star-rating rating="{{styleRating}}"></star-rating>
        </div>

        <paper-textarea
          id="commentInput"
          hidden$="[[!hasRated]]"
          label="Comment"
          value="{{comment}}"
          maxlength="256"
        ></paper-textarea>
        <p hidden$="[[!hasRated]]" class="helper">{$ feedback.helperText $}</p>
        <paper-button primary hidden$="[[!hasRated]]" on-click="setFeedback">
          {$ feedback.save $}
        </paper-button>
        <paper-button class="delete-button" hidden$="[[!feedback.data]]" on-click="removeFeedback">
          {$ feedback.deleteFeedback $}
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
  private setFeedbackState = initialState.set;
  @property({ type: Object })
  private feedback: RemoteData<Error, Feedback | false> = new Initialized();
  @property({ type: Object })
  private subscriptionState = initialState.subscription;
  @property({ type: Object })
  private removeFeedbackState = initialState.remove;

  override stateChanged(state: RootState) {
    this.setFeedbackState = selectSetFeedback(state);
    this.removeFeedbackState = selectRemoveFeedback(state);
    this.subscriptionState = selectSubscription(state);
    this.user = state.user;
    if (this.subscriptionState.kind === 'success') {
      this.feedback = selectFeedbackById(state, this.sessionId);
    }
  }

  private resetFeedback() {
    this.contentRating = 0;
    this.styleRating = 0;
    this.comment = '';
  }

  private async setFeedback() {
    if (!(this.user instanceof Success)) {
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
      store.dispatch(queueSnackbar('{$ feedback.feedbackRecorded $}'));
      // this.resetFeedback();
    } else {
      store.dispatch(
        queueComplexSnackbar({
          label: '{$ feedback.somethingWentWrong $}',
          action: {
            title: 'Retry',
            callback: () => this.setFeedback(),
          },
        })
      );
    }
  }

  private async removeFeedback() {
    if (!(this.user instanceof Success)) {
      return;
    }

    const resultAction = await store.dispatch(
      removeFeedback({
        parentId: this.sessionId,
        userId: this.user.data.uid,
        id: this.user.data.uid,
      })
    );

    if (removeFeedback.fulfilled.match(resultAction)) {
      store.dispatch(queueSnackbar('{$ feedback.feedbackDeleted $}'));
    } else {
      store.dispatch(
        queueComplexSnackbar({
          label: '{$ feedback.somethingWentWrong $}',
          action: {
            title: 'Retry',
            callback: () => this.removeFeedback(),
          },
        })
      );
    }
  }

  @observe('feedback')
  private onFeedback(feedback: RemoteData<Error, Feedback | undefined>) {
    if (feedback instanceof Success) {
      this.contentRating = feedback.data.contentRating;
      this.styleRating = feedback.data.styleRating;
      this.comment = feedback.data.comment;
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
