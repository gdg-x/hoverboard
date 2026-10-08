import '@material/web/button/outlined-button.js';
import { Success } from '@abraham/remotedata';
import { msg } from '@lit/localize';
import { css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import '../shared/hoverboard-icon';
import '../shared/text-truncate';
import type { Speaker } from '../../models/speaker';
import { router } from '../../router';
import { type SpeakersState, selectSpeakersState } from '../../store/speakers';
import { randomOrder } from '../../utils/arrays';
import { fromStore } from '../../controllers/from-store';
import { ThemedElement } from '../themed-element';

@customElement('speakers-block')
export class SpeakersBlock extends ThemedElement {
  static override styles = css`
    .speakers-wrapper {
      margin: 40px 0 32px;
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      grid-gap: 32px 16px;
    }

    .speaker {
      position: relative;
      padding: 24px 16px;
      color: inherit;
      text-align: center;
    }

    /* Covers the card. Links may not nest, so the badge links sit above it. */
    .speaker-link {
      position: absolute;
      inset: 0;
    }

    .speaker-photo-wrapper {
      position: relative;
    }

    .photo {
      display: inline-block;
      --lazy-image-width: 72px;
      --lazy-image-height: 72px;
      --lazy-image-fit: cover;
      width: var(--lazy-image-width);
      height: var(--lazy-image-height);
      background-color: var(--accent-color);
      border-radius: 50%;
      overflow: hidden;
      transform: translateZ(0);
    }

    .badges {
      position: absolute;
      top: 0;
      left: calc(50% + 24px);
      display: flex;
      flex-direction: row;
    }

    .badge {
      margin-left: -10px;
      display: flex;
      width: 24px;
      height: 24px;
      flex-direction: row;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      border: 2px solid var(--default-background-color);
      transition: transform var(--animation);
    }

    .badge:hover {
      transform: scale(1.1);
    }

    .badge:nth-of-type(2) {
      transform: translate(0, 100%);
    }

    .badge:nth-of-type(2):hover {
      transform: translate3d(0, 100%, 20px) scale(1.1);
    }

    .badge-icon {
      width: 12px;
      height: 12px;
      color: var(--text-primary-color);
    }

    .company-logo {
      margin-top: 6px;
      --lazy-image-width: 100%;
      --lazy-image-height: 16px;
      --lazy-image-fit: contain;
      width: var(--lazy-image-width);
      height: var(--lazy-image-height);
    }

    .description {
      color: var(--primary-text-color);
    }

    .name {
      margin-top: 8px;
      line-height: 1.1;
    }

    .origin {
      margin-top: 4px;
      font-size: 14px;
      line-height: 1.1;
    }

    .cta-button {
      margin-top: 24px;
    }

    @media (min-width: 640px) {
      .photo {
        --lazy-image-width: 128px;
        --lazy-image-height: 128px;
      }

      .name {
        font-size: 24px;
      }
    }

    @media (min-width: 812px) {
      .speakers-wrapper {
        grid-template-columns: repeat(3, 1fr);
      }

      .speaker:last-of-type {
        display: none;
      }

      .badges {
        left: calc(50% + 32px);
      }

      .badge:nth-of-type(2) {
        transform: translate(25%, 75%);
      }

      .badge:nth-of-type(2):hover {
        transform: translate3d(25%, 75%, 20px) scale(1.1);
      }

      .badge:nth-of-type(3) {
        transform: translate(10%, 180%);
      }

      .badge:nth-of-type(3):hover {
        transform: translate3d(10%, 180%, 20px) scale(1.1);
      }
    }

    @media (min-width: 1024px) {
      .speakers-wrapper {
        grid-template-columns: repeat(4, 1fr);
      }

      .speaker:last-of-type {
        display: block;
      }
    }
  `;

  @fromStore((state) => selectSpeakersState(state))
  accessor speakers!: SpeakersState;

  override render() {
    return html`
      <div class="container">
        <h1 class="container-title">${msg('Speakers', { id: 'home.speakers-block.title' })}</h1>

        <div class="speakers-wrapper">
          ${this.featuredSpeakers.map(
            (speaker) => html`
              <div class="speaker card">
                <a
                  class="speaker-link"
                  href="${this.speakerUrl(speaker.id)}"
                  aria-label="${speaker.name}"
                ></a>
                <div class="speaker-photo-wrapper">
                  <img
                    loading="lazy"
                    decoding="async"
                    class="photo"
                    src="${speaker.photoUrl}"
                    alt="${speaker.name}"
                  />
                  <div class="badges">
                    ${(speaker.badges ?? []).map(
                      (badge) => html`
                        <a
                          class="badge ${badge.name}-b"
                          href="${badge.link}"
                          target="_blank"
                          rel="noopener noreferrer"
                          title="${badge.description}"
                        >
                          <hoverboard-icon
                            name="${badge.name.toLowerCase()}"
                            class="badge-icon"
                          ></hoverboard-icon>
                        </a>
                      `,
                    )}
                  </div>
                </div>

                <img
                  loading="lazy"
                  decoding="async"
                  class="company-logo"
                  src="${speaker.companyLogoUrl}"
                  alt="${speaker.company}"
                />

                <div class="description">
                  <text-truncate lines="1">
                    <h3 class="name">${speaker.name}</h3>
                  </text-truncate>
                  <text-truncate lines="1">
                    <div class="origin">${speaker.country}</div>
                  </text-truncate>
                </div>
              </div>
            `,
          )}
        </div>

        <a href="/speakers">
          <md-outlined-button class="cta-button animated icon-right" trailing-icon>
            <span>${msg('View all speakers', { id: 'home.speakers-block.cta' })}</span>
            <hoverboard-icon slot="icon" name="arrow-right-circle"></hoverboard-icon>
          </md-outlined-button>
        </a>
      </div>
    `;
  }

  get featuredSpeakers(): Speaker[] {
    if (this.speakers instanceof Success) {
      const { data } = this.speakers;
      const filteredSpeakers = data.filter((speaker) => speaker.featured);
      const speakers = filteredSpeakers.length ? filteredSpeakers : data;
      return (this.shuffled ? randomOrder(speakers) : speakers).slice(0, 4);
    }

    return [];
  }

  // The first render follows the stored order, as on the server, so hydration matches.
  @state()
  private accessor shuffled = false;

  override firstUpdated() {
    this.shuffled = true;
  }

  private speakerUrl(id: string) {
    return router.urlForName('speaker-page', { id });
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'speakers-block': SpeakersBlock;
  }
}
