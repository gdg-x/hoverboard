import { customElement, property } from '@polymer/decorators';
import '@polymer/iron-icon';
import '@polymer/paper-button';
import '@polymer/paper-icon-button';
import { html, PolymerElement } from '@polymer/polymer';
import 'plastic-image';
import { ReduxMixin } from '../mixins/redux-mixin';
import { RootState, store } from '../store';
import { toggleVideoDialog } from '../store/ui/actions';
import { fetchVideos } from '../store/videos/actions';
import './shared-animations';
import './shared-styles';

@customElement('featured-videos')
export class FeaturedVideos extends ReduxMixin(PolymerElement) {
  static get template() {
    return html`
      <style include="shared-styles flex flex-alignment positioning">
        :host {
          display: block;
          --video-item-height: 200px;
        }

        .videos-wrapper {
          position: relative;
          overflow: hidden;
        }

        .video-list {
          margin-bottom: -20px;
          flex-wrap: nowrap;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }

        .videos {
          transition: transform var(--slideAnimation);
          will-change: transition;
          transform: translateX(0);
        }

        .slide-icon {
          display: none;
        }

        .video-item {
          width: 300px;
        }

        .video-item:not(:last-of-type) {
          padding-right: 18px;
        }

        .video-item:hover .video-play-icon {
          transform: scale(1.2) translateZ(0);
        }

        .thumbnail {
          width: 100%;
          height: var(--video-item-height);
          overflow: hidden;
          border-radius: var(--border-radius);
        }

        .thumbnail-image {
          background-color: var(--secondary-background-color);
        }

        .image-overlay {
          background-color: rgba(0, 0, 0, 0.4);
        }

        .video-play-icon {
          width: 60px;
          height: 60px;
          color: #fff;
          opacity: 0.8;
          transform: translateZ(0);
          transition: transform var(--animation);
        }

        .video-title {
          margin-top: 8px;
          font-family: var(--font-family);
          color: var(--secondary-text-color);
        }

        .cta-button {
          margin-top: 24px;
        }

        @media (min-width: 640px) {
          :host {
            --video-item-height: 256px;
          }

          .video-item {
            width: calc(var(--max-container-width) / 3 - 16px);
            cursor: pointer;
          }

          .video-item:not(:last-of-type) {
            padding-right: 30px;
          }

          .slide-icon {
            margin: 8px;
            width: 40px;
            height: 40px;
            position: absolute;
            z-index: 1;
            top: calc(var(--video-item-height) / 2 - 25px);
            display: block;
            opacity: 0.9;
            background-color: #fff;
            border-radius: 50%;
            color: var(--default-primary-color);
            transition: opacity var(--animation);
            display: block;
          }

          .slide-icon:last-of-type {
            right: 0;
          }
        }
      </style>
      <div class="container">
        <div class="header" layout horizontal justified center wrap>
          <h1 class="container-title">{$ featuredVideos.title $}</h1>
        </div>

        <div class="videos-wrapper" layout flex horizontal>
          <paper-icon-button
            class="last-video slide-icon"
            icon="hoverboard:chevron-left"
            on-click="shiftContentLeft"
            ga-on="click"
            ga-event-category="video-list-arrow"
            ga-event-action="click"
            ga-event-label="left"
            hidden$="[[_leftArrowHidden]]"
          ></paper-icon-button>
          <div id="videoList" class="video-list" layout flex horizontal>
            <div id="videos" class="videos" layout horizontal>
              <template is="dom-repeat" items="[[videos]]" as="block" index-as="index">
                <div
                  class="video-item"
                  on-click="playVideo"
                  ga-on="click"
                  ga-event-category="video"
                  ga-event-action="watch"
                  ga-event-label$="[[block.title]]"
                >
                  <div class="thumbnail" relative layout horizontal center-center>
                    <plastic-image
                      id="image[[index]]"
                      class="thumbnail-image"
                      srcset="[[block.thumbnail]]"
                      sizing="cover"
                      lazy-load
                      preload
                      fade
                      fit
                    ></plastic-image>
                    <div class="image-overlay" fit></div>
                    <paper-icon-button
                      class="video-play-icon"
                      icon="hoverboard:play"
                    ></paper-icon-button>
                  </div>
                  <h4 class="video-title">[[block.title]]</h4>
                </div>
              </template>
            </div>
          </div>
          <paper-icon-button
            class="next-video slide-icon"
            icon="hoverboard:chevron-right"
            on-click="shiftContentRight"
            ga-on="click"
            ga-event-category="video-list-arrow"
            ga-event-action="click"
            ga-event-label="right"
            hidden$="[[_rightArrowHidden]]"
          >
            &gt;</paper-icon-button
          >
        </div>
        <a href="{$ featuredVideos.callToAction.link $}" target="_blank" rel="noopener noreferrer">
          <paper-button class="cta-button animated icon-right">
            <span>{$ featuredVideos.callToAction.label $}</span>
            <iron-icon icon="hoverboard:arrow-right-circle"></iron-icon>
          </paper-button>
        </a>
      </div>
    `;
  }

  @property({ type: Array })
  private videos = [];
  @property({ type: Boolean })
  private videosFetching = false;
  @property({ type: Object })
  private videosFetchingError = {};
  @property({ type: Object })
  private viewport = {};
  @property({ type: Boolean })
  private _leftArrowHidden = true;
  @property({ type: Boolean })
  private _rightArrowHidden = false;

  stateChanged(state: RootState) {
    this.videos = state.videos.list;
    this.videosFetching = state.videos.fetching;
    this.videosFetchingError = state.videos.fetchingError;
    this.viewport = state.ui.viewport;
  }

  connectedCallback() {
    super.connectedCallback();
    store.dispatch(fetchVideos());
  }

  shiftContentLeft() {
    const { cardWidth, currentPosition } = this.getVideosDetails();

    let newX = currentPosition + cardWidth;

    if (currentPosition < 0) {
      const adjustToLeft = newX > 0 || Math.abs(0 - Math.abs(newX)) < cardWidth;

      if (adjustToLeft) {
        newX = 0;
      }

      this.transformVideoList(this.$.videos, newX);

      if (newX == 0) {
        this._leftArrowHidden = true;
      } else {
        this._rightArrowHidden = false;
      }
    }
  }

  shiftContentRight() {
    const { cardWidth, maxRightPosition, currentPosition } = this.getVideosDetails();

    let newX = currentPosition - cardWidth;

    if (currentPosition >= maxRightPosition) {
      const adjustToRight =
        newX < maxRightPosition || Math.abs(maxRightPosition) - Math.abs(newX) < cardWidth;

      if (adjustToRight) {
        newX = maxRightPosition;
      }

      this.transformVideoList(this.$.videos, newX);

      if (newX == maxRightPosition) {
        this._rightArrowHidden = true;
      } else {
        this._leftArrowHidden = false;
      }
    }
  }

  getVideosDetails() {
    const videos = this.shadowRoot.querySelectorAll('.video-item');
    const cardRect = videos[videos.length - 1].getBoundingClientRect();
    const cardWidth = cardRect.width;
    const videosContainerWidth = parseInt(
      getComputedStyle(this.$.videoList, null).getPropertyValue('width')
    );
    const videosWidth = parseInt(getComputedStyle(this.$.videos, null).getPropertyValue('width'));
    const maxRightPosition = -(videosWidth - videosContainerWidth) - 16;
    const currentPosition = parseInt(
      getComputedStyle(this.$.videos, null).getPropertyValue('transform').split(',')[4]
    );

    return {
      cardWidth,
      maxRightPosition,
      currentPosition,
    };
  }

  getVideoListWidth() {
    const videos = this.shadowRoot.querySelectorAll('.video-item');
    const cardRect = videos[videos.length - 1].getBoundingClientRect();
    return cardRect.width * videos.length;
  }

  transformVideoList(el, newPosition) {
    el.style.transform = 'translate3d(' + newPosition + 'px, 0, 0)';
  }

  playVideo(e) {
    const presenters = e.model.__data.block.speakers ? ` by ${e.model.__data.block.speakers}` : '';
    const title = e.model.__data.block.title + presenters;
    const youtubeId = e.model.__data.block.youtubeId;

    toggleVideoDialog({
      title: title,
      youtubeId: youtubeId,
      disableControls: true,
      opened: true,
    });
  }
}
