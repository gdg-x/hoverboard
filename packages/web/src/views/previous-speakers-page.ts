import { Failure, Success } from '@abraham/remotedata';
import { msg } from '@lit/localize';
import { css, html, nothing } from 'lit';
import { customElement } from 'lit/decorators.js';
import '../components/ui/hb-progress';
import '../components/shared/content-loader';
import '../components/hero/simple-hero';
import type { PreviousSession } from '../models/previous-session';
import { previousSpeakerPath } from '../utils/navigation';
import {
  type PreviousSpeakersState,
  selectPreviousSpeakersState,
} from '../store/previous-speakers';
import { contentLoaders } from '../config/site';
import { getLocale } from '../utils/localization';
import { PageMetadataController } from '../controllers/page-metadata-controller';
import { fromStore } from '../controllers/from-store';
import { ThemedElement } from '../components/themed-element';

@customElement('previous-speakers-page')
export class PreviousSpeakersPage extends ThemedElement {
  static override styles = css`
    :host {
      height: 100%;
    }

    .container {
      margin: 32px auto;
      display: grid;
      grid-template-columns: 1fr;
      grid-gap: 32px;
      min-height: 80%;
    }

    .speaker:hover .photo {
      transform: scale(0.95);
    }

    .photo {
      --lazy-image-width: 96px;
      --lazy-image-height: 96px;
      --lazy-image-fit: cover;
      width: var(--lazy-image-width);
      height: var(--lazy-image-height);
      background-color: var(--contrast-additional-background-color);
      border: 3px solid var(--contrast-additional-background-color);
      border-radius: 50%;
      overflow: hidden;
      transform: translateZ(0);
      transition: transform var(--animation);
      flex-shrink: 0;
    }

    .company-logo {
      max-width: 88px;
      height: 16px;
      margin: 8px 0;
    }

    .details {
      margin-left: 16px;
      color: var(--primary-text-color);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: flex-start;
    }

    .name {
      font-size: 20px;
      line-height: 1;
    }

    .origin {
      margin-top: 4px;
      font-size: 14px;
      line-height: 1.1;
    }

    .sessions {
      font-size: 13px;
      line-height: 1.1;
      font-weight: bold;
    }

    .sessions h5 {
      margin-right: 4px;
      font-weight: normal;
    }

    .speaker {
      display: flex;
    }

    @media (min-width: 640px) {
      .container {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (min-width: 812px) {
      .container {
        grid-gap: 64px 32px;
      }

      .photo {
        --lazy-image-width: 115px;
        --lazy-image-height: 115px;
        border-width: 5px;
      }

      .name {
        font-size: 24px;
      }
    }

    @media (min-width: 1024px) {
      .container {
        grid-template-columns: repeat(3, 1fr);
        grid-gap: 64px 32px;
      }

      .photo {
        --lazy-image-width: 128px;
        --lazy-image-height: 128px;
      }
    }
  `;

  @fromStore((state) => selectPreviousSpeakersState(state))
  accessor previousSpeakers!: PreviousSpeakersState;

  private readonly metadata = new PageMetadataController(this, 'previousSpeakers');
  private contentLoaders = contentLoaders.previousSpeakers;

  get contentLoaderVisibility() {
    return this.previousSpeakers instanceof Success || this.previousSpeakers instanceof Failure;
  }

  private yearsLabel(sessions: { [key: number]: PreviousSession[] }) {
    const count = Object.keys(sessions || {}).length;
    return new Intl.PluralRules(getLocale()).select(count) === 'one'
      ? msg('Year:', { id: 'pages.previous-speakers.years.one', desc: 'Followed by a year.' })
      : msg('Years:', {
          id: 'pages.previous-speakers.years.other',
          desc: 'Followed by a list of years.',
        });
  }

  private getYears(sessions: { [key: number]: PreviousSession[] }) {
    return Object.keys(sessions || {})
      .map(Number)
      .sort((a, b) => b - a)
      .join(', ');
  }

  private previousSpeakerUrl(id: string) {
    return previousSpeakerPath(id);
  }

  override render() {
    const previousSpeakers =
      this.previousSpeakers instanceof Success ? this.previousSpeakers.data : [];

    return html`
      <simple-hero page="previousSpeakers"></simple-hero>

      <hb-progress ?hidden=${this.contentLoaderVisibility}></hb-progress>

      <content-loader
        class="container"
        card-padding="0"
        card-height="128px"
        avatar-size="128px"
        avatar-circle="64px"
        items-count=${this.contentLoaders.itemsCount}
        ?hidden=${this.contentLoaderVisibility}
      ></content-loader>
      <div class="container">
        ${previousSpeakers.map(
          (speaker) => html`
            <a class="speaker" href=${this.previousSpeakerUrl(speaker.id)}>
              <img
                loading="lazy"
                decoding="async"
                class="photo"
                src=${speaker.photoUrl}
                alt=${speaker.name}
              />
              <div class="details">
                <h2 class="name">${speaker.name}</h2>
                <div class="origin">${speaker.country}</div>
                ${
                  speaker.companyLogo
                    ? html`<img
                        class="company-logo"
                        src=${speaker.companyLogo}
                        alt=${speaker.company}
                      />`
                    : nothing
                }
                <div class="sessions">
                  <h5>${this.yearsLabel(speaker.sessions)}</h5>
                  ${this.getYears(speaker.sessions)}
                </div>
              </div>
            </a>
          `,
        )}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'previous-speakers-page': PreviousSpeakersPage;
  }
}
