import '@google-web-components/google-youtube';
import '@polymer/paper-button';
import { PaperDialogBehavior } from '@polymer/paper-dialog-behavior/paper-dialog-behavior';
import '@polymer/paper-icon-button';
import { html, PolymerElement } from '@polymer/polymer';
import { mixinBehaviors } from '@polymer/polymer/lib/legacy/class';
import { ReduxMixin } from '../mixins/redux-mixin';
import { uiActions } from '../redux/actions';
import './shared-styles';
class VideoDialog extends ReduxMixin(mixinBehaviors([PaperDialogBehavior], PolymerElement)) {
  static get template() {
    return html`
      <style include="positioning">
        :host {
          margin: 0;
          padding: 0;
        }

        .video-wrapper {
          z-index: 6;
          overflow: hidden;
        }

        .go-back-icon {
          margin: 16px;
          z-index: 7;
          width: 40px;
          height: 40px;
          color: #fff;
          opacity: 0.6;
          background-color: #000;
          border-radius: 50%;
          display: block;
          transition: opacity var(--animation);
        }

        .go-back-icon:hover {
          opacity: 0.9;
        }

        .video {
          padding: 0;
        }
      </style>

      <div class="toolbar">
        <paper-icon-button
          class="go-back-icon"
          icon="hoverboard:close"
          on-click="_closeSelf"
          dialog-dismiss
        ></paper-icon-button>
      </div>
      <div class="video-wrapper">
        <google-youtube
          id="video"
          class="video"
          video-id="[[youtubeId]]"
          width="100%"
          height="100%"
          autohide="1"
          chromeless="[[disableControls]]"
          fit
        >
        </google-youtube>
      </div>
    `;
  }

  static get is() {
    return 'video-dialog';
  }

  static get properties() {
    return {
      videoTitle: String,
      opened: {
        type: Boolean,
        observer: 'videoDialogActionMade',
      },
      youtubeId: String,
      disableControls: {
        type: Boolean,
        value: false,
      },
    };
  }

  videoDialogActionMade() {
    if (this.opened) {
      if (this.withBackdrop) {
        this.backdropElement.open();
      }
      this.$.video.play();
    } else {
      this.$.video.seekTo(0);
      this.$.video.pause();
      this.backdropElement.close();
      this.opened = false;
    }
  }

  _closeSelf() {
    uiActions.toggleVideoDialog({
      opened: false,
      disableControls: false,
      youtubeId: '',
      title: '',
    });
  }
}

window.customElements.define(VideoDialog.is, VideoDialog);
