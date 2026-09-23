import { Failure, Initialized, Success } from '@abraham/remotedata';
import { css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import '@material/web/progress/linear-progress.js';
import '@power-elements/lazy-image';
import '../components/content-loader';
import '../components/footer-block';
import '../components/hero/simple-hero';
import { PreviousSession } from '../models/previous-session';
import { router } from '../router';
import { RootState } from '../store';
import { ReduxMixin } from '../store/mixin';
import { PreviousSpeakersState, selectPreviousSpeakersState } from '../store/previous-speakers';
import { contentLoaders, heroSettings, speakers } from '../utils/data';
import { updateMetadata } from '../utils/metadata';
import { ThemedElement } from '../components/themed-element';

@customElement('previous-speakers-page')
export class PreviousSpeakersPage extends ReduxMixin(ThemedElement) {
  static override get styles() {
    return [
      ...super.styles,
      css`
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

        .progress {
          width: 100%;
          --md-linear-progress-active-indicator-color: var(--default-primary-color);
          --md-linear-progress-track-color: var(--default-primary-color);
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
      `,
    ];
  }

  @property({ type: Object })
  previousSpeakers: PreviousSpeakersState = new Initialized();

  private heroSettings = heroSettings.previousSpeakers;
  private contentLoaders = contentLoaders.previousSpeakers;
  private previousYears = speakers.previousYears;

  get contentLoaderVisibility() {
    return this.previousSpeakers instanceof Success || this.previousSpeakers instanceof Failure;
  }

  override stateChanged(state: RootState) {
    this.previousSpeakers = selectPreviousSpeakersState(state);
  }

  override connectedCallback() {
    super.connectedCallback();
    updateMetadata(this.heroSettings.title, this.heroSettings.metaDescription);
  }

  private getYears(sessions: { [key: number]: PreviousSession[] }) {
    return Object.keys(sessions || {})
      .map(Number)
      .sort((a, b) => b - a)
      .join(', ');
  }

  private previousSpeakerUrl(id: string) {
    return router.urlForName('previous-speaker-page', { id });
  }

  override render() {
    const previousSpeakers =
      this.previousSpeakers instanceof Success ? this.previousSpeakers.data : [];

    return html`
      <simple-hero page="previousSpeakers"></simple-hero>

      <md-linear-progress
        class="progress"
        indeterminate
        ?hidden=${this.contentLoaderVisibility}
      ></md-linear-progress>

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
              <lazy-image class="photo" src=${speaker.photoUrl} alt=${speaker.name}></lazy-image>
              <div class="details">
                <h2 class="name">${speaker.name}</h2>
                <div class="origin">${speaker.country}</div>
                <img class="company-logo" src=${speaker.companyLogo ?? ''} />
                <div class="sessions">
                  <h5>${this.previousYears}:</h5>
                  ${this.getYears(speaker.sessions)}
                </div>
              </div>
            </a>
          `,
        )}
      </div>

      <footer-block></footer-block>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'previous-speakers-page': PreviousSpeakersPage;
  }
}
