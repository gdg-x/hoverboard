import { Failure, Pending, Success } from '@abraham/remotedata';
import { msg } from '@lit/localize';
import { css, html, nothing } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import { featuredVideos } from '../../config/site';
import { fromStore } from '../../controllers/from-store';
import type { Video } from '../../models/video';
import { openVideoDialog } from '../../store/ui';
import { type VideosState, selectVideos } from '../../store/videos';
import { band } from '../../styles/band';
import '../shared/hoverboard-icon';
import { ThemedElement } from '../themed-element';
import '../ui/hb-button';
import '../ui/hb-icon-button';

/** A rail of videos that scrolls sideways. Each plays in the video dialog. */
@customElement('featured-videos')
export class FeaturedVideos extends ThemedElement {
  static override styles = [
    band,
    css`
      .controls {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--hb-space-2);
      }

      .rail {
        display: grid;
        grid-auto-columns: max(15rem, (100% - 2 * var(--hb-space-5)) / 3);
        grid-auto-flow: column;
        gap: var(--hb-space-5);
        /* Room for the cards' shadows, which the scroll box would clip. */
        padding: var(--hb-space-1) var(--hb-space-2) var(--hb-space-4) var(--hb-space-1);
        overflow-x: auto;
        overscroll-behavior-x: contain;
        scroll-snap-type: x mandatory;
        scroll-behavior: smooth;
        scrollbar-width: thin;
      }

      .rail li {
        scroll-snap-align: start;
      }

      .video {
        display: grid;
        gap: var(--hb-space-3);
        inline-size: 100%;
        margin: 0;
        padding: 0;
        border: 0;
        background: none;
        color: inherit;
        font: inherit;
        text-align: start;
        cursor: pointer;
      }

      .thumbnail {
        position: relative;
        display: grid;
        place-items: center;
        aspect-ratio: 16 / 9;
        overflow: hidden;
        border: var(--hb-border-width) solid var(--hb-border-color);
        border-radius: var(--hb-radius-m);
        background-color: var(--hb-color-surface-container);
        box-shadow: var(--hb-shadow-card);
        transition:
          translate var(--hb-duration-short) var(--hb-ease-spring),
          box-shadow var(--hb-duration-short) var(--hb-ease-standard);
      }

      .video:hover .thumbnail {
        translate: -2px -2px;
        box-shadow: var(--hb-shadow-card-hover);
      }

      .thumbnail img {
        position: absolute;
        inset: 0;
        inline-size: 100%;
        block-size: 100%;
        object-fit: cover;
      }

      .play {
        position: relative;
        display: grid;
        place-items: center;
        inline-size: 56px;
        block-size: 56px;
        border: var(--hb-border-width) solid var(--hb-border-color);
        border-radius: 50%;
        background-color: var(--hb-cta-background);
        color: var(--hb-on-cta);
      }

      .play hoverboard-icon {
        inline-size: 28px;
        block-size: 28px;
      }

      .title {
        font-weight: 600;
        line-height: 1.3;
      }

      .all {
        margin-block-start: var(--hb-space-5);
      }
    `,
  ];

  @fromStore((state) => selectVideos(state))
  accessor videos!: VideosState;

  @query('.rail')
  private accessor rail!: HTMLElement | null;

  // At the start on the server and in the first render, where nothing has scrolled.
  @state()
  private accessor atStart = true;

  @state()
  private accessor atEnd = false;

  // Measured after the update, so a change does not start another update inside this one.
  override firstUpdated() {
    void this.updateComplete.then(this.updateEnds);
  }

  // The rail's width changes when the videos arrive.
  override updated(changed: Map<PropertyKey, unknown>) {
    if (changed.has('videos')) void this.updateComplete.then(this.updateEnds);
  }

  override render() {
    return html`
      <div class="inner">
        <div class="band-header">
          <h2 class="band-title">${featuredVideos.title}</h2>
          <div class="controls">
            <hb-icon-button
              class="previous"
              label="${msg('Previous videos', { id: 'home.featured-videos.previous' })}"
              ?disabled="${this.atStart}"
              @click="${() => this.scrollRail(-1)}"
            >
              <hoverboard-icon name="chevron-left"></hoverboard-icon>
            </hb-icon-button>
            <hb-icon-button
              class="next"
              label="${msg('Next videos', { id: 'home.featured-videos.next' })}"
              ?disabled="${this.atEnd}"
              @click="${() => this.scrollRail(1)}"
            >
              <hoverboard-icon name="chevron-right"></hoverboard-icon>
            </hb-icon-button>
          </div>
        </div>
        ${
          this.videos instanceof Pending
            ? html`<p>${msg('Loading...', { id: 'common.loading' })}</p>`
            : nothing
        }
        ${
          this.videos instanceof Failure
            ? html`<p>${msg('Error loading videos.', { id: 'home.featured-videos.error' })}</p>`
            : nothing
        }
        <ul class="rail plain" @scroll="${this.updateEnds}">
          ${this.videosData.map(
            (video) => html`
              <li>
                <button class="video" type="button" @click="${() => this.playVideo(video)}">
                  <span class="thumbnail">
                    <img src="${video.thumbnail}" alt="" loading="lazy" />
                    <span class="play"><hoverboard-icon name="play"></hoverboard-icon></span>
                  </span>
                  <span class="title">${video.title}</span>
                </button>
              </li>
            `,
          )}
        </ul>
        <hb-button
          variant="outlined"
          class="all"
          href="${featuredVideos.callToAction.link}"
          target="_blank"
          trailing-icon
        >
          ${msg('See all videos', { id: 'home.featured-videos.cta' })}
          <hoverboard-icon slot="icon" name="arrow-right-circle"></hoverboard-icon>
        </hb-button>
      </div>
    `;
  }

  private get videosData(): Video[] {
    return this.videos instanceof Success ? this.videos.data : [];
  }

  private scrollRail(direction: 1 | -1) {
    const { rail } = this;
    if (!rail) return;
    const rtl = getComputedStyle(rail).direction === 'rtl' ? -1 : 1;
    rail.scrollBy({ left: direction * rtl * rail.clientWidth * 0.9 });
  }

  private readonly updateEnds = () => {
    const { rail } = this;
    if (!rail) return;
    const scrolled = Math.abs(rail.scrollLeft);
    this.atStart = scrolled <= 1;
    this.atEnd = scrolled + rail.clientWidth >= rail.scrollWidth - 1;
  };

  private playVideo(video: Video) {
    const presenters = video.speakers ? ` by ${video.speakers}` : '';
    openVideoDialog({ title: video.title + presenters, youtubeId: video.youtubeId });
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'featured-videos': FeaturedVideos;
  }
}
