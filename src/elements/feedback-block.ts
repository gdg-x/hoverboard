import '@polymer/paper-button';
import '@polymer/paper-input/paper-textarea';
import { html, PolymerElement } from '@polymer/polymer';
import '@radi-cho/star-rating';
import { ReduxMixin } from '../mixins/redux-mixin';
import { addComment, checkPreviousFeedback, deleteFeedback } from '../store/feedback/actions';
import { RootState, store } from '../store';
import { showToast } from '../store/toast/actions';
import { computed, customElement, observe, property } from '@polymer/decorators';

@customElement('feedback-block')
export class Feedback extends ReduxMixin(PolymerElement) {
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
          hidden$="[[!rating]]"
          label="Comment"
          value="{{comment}}"
          maxlength="256"
        ></paper-textarea>
        <p hidden$="[[!rating]]" class="helper">{$ feedback.helperText $}</p>
        <paper-button
          primary
          hidden$="[[!rating]]"
          on-click="_sendFeedback"
          ga-on="click"
          ga-event-category="feedback"
          ga-event-action="send feedback"
          ga-event-label$="submit the [[rating]] stars feedback"
        >
          {$ feedback.save $}
        </paper-button>
        <paper-button
          class="delete-button"
          hidden$="[[!showDeleteButton]]"
          on-click="_dispatchDeleteFeedback"
          ga-on="click"
          ga-event-category="feedback"
          ga-event-action="delete feedback"
          ga-event-label$="delete the feedback record"
        >
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
  private comment = '';
  @property({ type: String })
  private collection: string;
  @property({ type: String })
  private dbItem: string;
  @property({ type: Object })
  private user: { uid?: string; signedIn?: boolean } = {};
  @property({ type: Object })
  private previousFeedback: { comment?: string; styleRating?: number; contentRating?: number } = {};
  @property({ type: Boolean, observer: Feedback.prototype._feedbackAddingChanged })
  private feedbackFetching = false;
  @property({ type: Boolean })
  private feedbackAdding = false;
  @property({ type: Object })
  private feedbackAddingError = {};
  @property({ type: Boolean, observer: Feedback.prototype._feedbackDeletingChanged })
  private feedbackDeleting = false;
  @property({ type: Object })
  private feedbackDeletingError = {};
  @property({ type: Boolean })
  private showDeleteButton = false;
  @property({ type: Boolean })
  private feedbackState = {};

  stateChanged(state: RootState) {
    this.feedbackState = state.feedback;
    this.feedbackDeleting = state.feedback.deleting;
    this.feedbackDeletingError = state.feedback.deletingError;
    this.feedbackAdding = state.feedback.adding;
    this.feedbackAddingError = state.feedback.addingError;
    this.feedbackFetching = state.feedback.fetching;
    this.user = state.user;
  }

  @observe('feedbackState')
  _updateFeedbackState(feedbackState) {
    if (feedbackState[this.collection]) {
      if (this.dbItem) this.previousFeedback = feedbackState[this.collection][this.dbItem];
    } else {
      this.previousFeedback = undefined;
    }
  }

  @observe('user')
  _userChanged(newUser) {
    if (newUser.signedIn) {
      if (this.dbItem && !this.feedbackFetching) this._dispatchPreviousFeedback();
    } else {
      this._clear();
    }
  }

  _clear() {
    this.contentRating = 0;
    this.styleRating = 0;
    this.comment = '';
    this.showDeleteButton = false;
  }

  @observe('dbItem')
  _dbItemChanged(newdbItem) {
    this._clear();

    if (newdbItem) {
      // Check for previous feedback once the session/speaker id is available
      this._updateFeedbackState(this.feedbackState);
      this._previousFeedbackChanged(this.previousFeedback);

      if (this.user.signedIn && !this.feedbackFetching && this.previousFeedback === undefined) {
        this._dispatchPreviousFeedback();
      }
    }
  }

  @observe('previousFeedback')
  _previousFeedbackChanged(previousFeedback) {
    if (previousFeedback) {
      this.showDeleteButton = true;
      this.contentRating = previousFeedback.contentRating;
      this.styleRating = previousFeedback.styleRating;
      this.comment = previousFeedback.comment;
    }
  }

  _sendFeedback() {
    if (!this.rating) return;
    this._dispatchSendFeedback();
  }

  _dispatchSendFeedback() {
    store.dispatch(
      addComment({
        userId: this.user.uid,
        collection: this.collection,
        dbItem: this.dbItem,
        contentRating: this.contentRating,
        styleRating: this.styleRating,
        comment: this.comment,
      })
    );
  }

  _dispatchPreviousFeedback() {
    store.dispatch(
      checkPreviousFeedback({
        collection: this.collection,
        dbItem: this.dbItem,
        userId: this.user.uid,
      })
    );
  }

  _dispatchDeleteFeedback() {
    store.dispatch(
      deleteFeedback({
        collection: this.collection,
        dbItem: this.dbItem,
        userId: this.user.uid,
      })
    );
  }

  _feedbackAddingChanged(newFeedbackAdding, oldFeedbackAdding) {
    if (oldFeedbackAdding && !newFeedbackAdding) {
      if (this.feedbackAddingError) {
        showToast({
          message: '{$ feedback.somethingWentWrong $}',
          action: {
            title: 'Retry',
            callback: () => {
              this._dispatchSendFeedback();
            },
          },
        });
      } else {
        showToast({ message: '{$ feedback.feedbackRecorded $}' });
      }
    }
  }

  _feedbackDeletingChanged(newFeedbackDeleting, oldFeedbackDeleting) {
    if (oldFeedbackDeleting && !newFeedbackDeleting) {
      if (this.feedbackDeletingError) {
        showToast({
          message: '{$ feedback.somethingWentWrong $}',
          action: {
            title: 'Retry',
            callback: () => {
              this._dispatchDeleteFeedback();
            },
          },
        });
      } else {
        this._clear();
        showToast({ message: '{$ feedback.feedbackDeleted $}' });
      }
    }
  }

  @computed('contentRating', 'styleRating')
  get rating() {
    return (
      (this.contentRating > 0 && this.contentRating <= 5) ||
      (this.styleRating > 0 && this.styleRating <= 5)
    );
  }
}
