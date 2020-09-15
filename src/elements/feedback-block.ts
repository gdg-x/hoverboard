import '@polymer/paper-button';
import '@polymer/paper-input/paper-textarea';
import { html, PolymerElement } from '@polymer/polymer';
import '@radi-cho/star-rating';
import { ReduxMixin } from '../mixins/redux-mixin';
import { feedbackActions, toastActions } from '../redux/actions';
import { State, store } from '../redux/store';

class Feedback extends ReduxMixin(PolymerElement) {
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

  private rating = false;
  private contentRating = 0;
  private styleRating = 0;
  private comment = '';
  private collection: string;
  private dbItem: string;
  private user: { uid?: string; signedIn?: boolean } = {};
  private previousFeedback: { comment?: string; styleRating?: number; contentRating?: number } = {};
  private feedbackFetching = false;
  private feedbackAdding = false;
  private feedbackAddingError = {};
  private feedbackDeleting = false;
  private feedbackDeletingError = {};
  private showDeleteButton = false;
  private feedbackState = {};

  static get properties() {
    return {
      rating: {
        type: Boolean,
        value: false,
        computed: '_hasRating(contentRating, styleRating)',
      },
      contentRating: {
        type: Number,
        value: 0,
      },
      styleRating: {
        type: Number,
        value: 0,
      },
      comment: {
        type: String,
        value: '',
      },
      collection: {
        type: String,
        value: 'sessions',
      },
      dbItem: {
        type: String,
        observer: '_dbItemChanged',
      },
      user: {
        type: Object,
        observer: '_userChanged',
      },
      previousFeedback: {
        type: Object,
        observer: '_previousFeedbackChanged',
      },
      feedbackFetching: {
        type: Boolean,
      },
      feedbackAdding: {
        type: Boolean,
        observer: '_feedbackAddingChanged',
      },
      feedbackAddingError: {
        type: Object,
      },
      feedbackDeleting: {
        type: Boolean,
        observer: '_feedbackDeletingChanged',
      },
      feedbackDeletingError: {
        type: Object,
      },
      showDeleteButton: {
        type: Boolean,
        value: false,
      },
      feedbackState: {
        type: Object,
        observer: '_updateFeedbackState',
      },
    };
  }

  static get is() {
    return 'feedback-block';
  }

  stateChanged(state: State) {
    return this.setProperties({
      feedbackState: state.feedback,
      feedbackDeleting: state.feedback.deleting,
      feedbackDeletingError: state.feedback.deletingError,
      feedbackAdding: state.feedback.adding,
      feedbackAddingError: state.feedback.addingError,
      feedbackFetching: state.feedback.fetching,
      user: state.user,
    });
  }

  _updateFeedbackState() {
    if (this.feedbackState[this.collection]) {
      if (this.dbItem) this.previousFeedback = this.feedbackState[this.collection][this.dbItem];
    } else {
      this.previousFeedback = undefined;
    }
  }

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

  _dbItemChanged(newdbItem, _olddbItem) {
    this._clear();

    if (newdbItem) {
      // Check for previous feedback once the session/speaker id is available
      this._updateFeedbackState();
      this._previousFeedbackChanged();

      if (this.user.signedIn && !this.feedbackFetching && this.previousFeedback === undefined) {
        this._dispatchPreviousFeedback();
      }
    }
  }

  _previousFeedbackChanged() {
    if (this.previousFeedback) {
      this.showDeleteButton = true;
      this.contentRating = this.previousFeedback.contentRating;
      this.styleRating = this.previousFeedback.styleRating;
      this.comment = this.previousFeedback.comment;
    }
  }

  _sendFeedback() {
    if (!this.rating) return;
    this._dispatchSendFeedback();
  }

  _dispatchSendFeedback() {
    store.dispatch(
      feedbackActions.addComment({
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
      feedbackActions.checkPreviousFeedback({
        collection: this.collection,
        dbItem: this.dbItem,
        userId: this.user.uid,
      })
    );
  }

  _dispatchDeleteFeedback() {
    store.dispatch(
      feedbackActions.deleteFeedback({
        collection: this.collection,
        dbItem: this.dbItem,
        userId: this.user.uid,
      })
    );
  }

  _feedbackAddingChanged(newFeedbackAdding, oldFeedbackAdding) {
    if (oldFeedbackAdding && !newFeedbackAdding) {
      if (this.feedbackAddingError) {
        toastActions.showToast({
          message: '{$ feedback.somethingWentWrong $}',
          action: {
            title: 'Retry',
            callback: () => {
              this._dispatchSendFeedback();
            },
          },
        });
      } else {
        toastActions.showToast({ message: '{$ feedback.feedbackRecorded $}' });
      }
    }
  }

  _feedbackDeletingChanged(newFeedbackDeleting, oldFeedbackDeleting) {
    if (oldFeedbackDeleting && !newFeedbackDeleting) {
      if (this.feedbackDeletingError) {
        toastActions.showToast({
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
        toastActions.showToast({ message: '{$ feedback.feedbackDeleted $}' });
      }
    }
  }

  _hasRating(contentRating, styleRating) {
    return (contentRating > 0 && contentRating <= 5) || (styleRating > 0 && styleRating <= 5);
  }
}

window.customElements.define(Feedback.is, Feedback);
