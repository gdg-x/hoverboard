import { Failure, Initialized, Pending, Success } from '@abraham/remotedata';
import '@material/web/button/text-button.js';
import '@power-elements/lazy-image';
import { css, html } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { Video } from '../models/video';
import { RootState } from '../store';
import { ReduxMixin } from '../store/mixin';
import { openVideoDialog } from '../store/ui';
import { VideosState, selectVideos } from '../store/videos';
import { featuredVideos, loading } from '../utils/data';
import './hoverboard-icon';
import { ThemedElement } from './themed-element';

@customElement('featured-videos')
export class FeaturedVideos extends ReduxMixin(ThemedElement) {
  static override get styles() {
    return [
      ...super.styles,
      css`
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
          transition: transform var(--slide-animation);
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
          position: absolute;
          --lazy-image-width: 100%;
          --lazy-image-height: 100%;
          --lazy-image-fit: cover;
          width: var(--lazy-image-width);
          height: var(--lazy-image-height);
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
      `,
    ];
  }

  private featuredVideos = featuredVideos;
  private loading = loading;

  @query('#videos')
  videosElm!: HTMLDivElement;
  @query('#videoList')
  videoList!: HTMLDivElement;

  @property({ type: Object })
  videos: VideosState = new Initialized();

  @state()
  private leftArrowHidden = true;
  @state()
  private rightArrowHidden = false;

  private get pending() {
    return this.videos instanceof Pending;
  }

  private get failure() {
    return this.videos instanceof Failure;
  }

  private get videosData(): Video[] {
    return this.videos instanceof Success ? this.videos.data : [];
  }

  override stateChanged(state: RootState) {
    this.videos = selectVideos(state);
  }

  private shiftContentLeft() {
    const { cardWidth, currentPosition } = this.getVideosDetails();

    let newX = currentPosition + cardWidth;

    if (currentPosition < 0) {
      const adjustToLeft = newX > 0 || Math.abs(0 - Math.abs(newX)) < cardWidth;

      if (adjustToLeft) {
        newX = 0;
      }

      this.transformVideoList(this.videosElm, newX);

      if (newX == 0) {
        this.leftArrowHidden = true;
      } else {
        this.rightArrowHidden = false;
      }
    }
  }

  private shiftContentRight() {
    const { cardWidth, maxRightPosition, currentPosition } = this.getVideosDetails();

    let newX = currentPosition - cardWidth;

    if (currentPosition >= maxRightPosition) {
      const adjustToRight =
        newX < maxRightPosition || Math.abs(maxRightPosition) - Math.abs(newX) < cardWidth;

      if (adjustToRight) {
        newX = maxRightPosition;
      }

      this.transformVideoList(this.videosElm, newX);

      if (newX == maxRightPosition) {
        this.rightArrowHidden = true;
      } else {
        this.leftArrowHidden = false;
      }
    }
  }

  private getVideosDetails() {
    const videos = this.shadowRoot!.querySelectorAll('.video-item');
    const lastVideo = videos[videos.length - 1];

    if (!this.videosElm || !this.videoList || !lastVideo) {
      throw new Error('Featured videos elements missing');
    }

    const cardRect = lastVideo.getBoundingClientRect();
    const cardWidth = cardRect.width;
    const videosContainerWidth = parseInt(
      getComputedStyle(this.videoList, null).getPropertyValue('width'),
    );
    const videosWidth = parseInt(getComputedStyle(this.videosElm, null).getPropertyValue('width'));
    const maxRightPosition = -(videosWidth - videosContainerWidth) - 16;
    const currentPosition = parseInt(
      getComputedStyle(this.videosElm, null).getPropertyValue('transform').split(',')[4] || '',
    );

    return {
      cardWidth,
      maxRightPosition,
      currentPosition,
    };
  }

  private transformVideoList(el: HTMLElement, newPosition: number) {
    el.style.transform = 'translate3d(' + newPosition + 'px, 0, 0)';
  }

  private playVideo(video: Video) {
    const presenters = video.speakers ? ` by ${video.speakers}` : '';
    const title = video.title + presenters;
    const youtubeId = video.youtubeId;

    openVideoDialog({ title, youtubeId });
  }

  override render() {
    return html`
      <div class="container">
        <div class="header" layout horizontal justified center wrap>
          <h1 class="container-title">${this.featuredVideos.title}</h1>
        </div>

        <div class="videos-wrapper" layout flex horizontal>
          <hoverboard-icon
            class="last-video slide-icon"
            name="chevron-left"
            @click="${() => this.shiftContentLeft()}"
            ?hidden="${this.leftArrowHidden}"
          ></hoverboard-icon>
          <div id="videoList" class="video-list" layout flex horizontal>
            <div id="videos" class="videos" layout horizontal>
              ${this.pending ? html`<p>${this.loading}</p>` : ''}
              ${this.failure ? html`<p>Error loading videos.</p>` : ''}
              ${this.videosData.map(
                (block, index) => html`
                  <div class="video-item" @click="${() => this.playVideo(block)}">
                    <div class="thumbnail" relative layout horizontal center-center>
                      <lazy-image
                        id="image${index}"
                        class="thumbnail-image"
                        src="${block.thumbnail}"
                        alt="${block.title}"
                      ></lazy-image>
                      <div class="image-overlay" fit></div>
                      <hoverboard-icon class="video-play-icon" name="play"></hoverboard-icon>
                    </div>
                    <h4 class="video-title">${block.title}</h4>
                  </div>
                `,
              )}
            </div>
          </div>
          <hoverboard-icon
            class="next-video slide-icon"
            name="chevron-right"
            @click="${() => this.shiftContentRight()}"
            ?hidden="${this.rightArrowHidden}"
          ></hoverboard-icon>
        </div>
        <a
          href="${this.featuredVideos.callToAction.link}"
          target="_blank"
          rel="noopener noreferrer"
        >
          <md-text-button class="cta-button animated icon-right" trailing-icon>
            <span>${this.featuredVideos.callToAction.label}</span>
            <hoverboard-icon slot="icon" name="arrow-right-circle"></hoverboard-icon>
          </md-text-button>
        </a>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'featured-videos': FeaturedVideos;
  }
}
