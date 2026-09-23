import { Initialized, Success } from '@abraham/remotedata';
import '@material/web/progress/linear-progress.js';
import '@power-elements/lazy-image';
import { css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import '../components/content-loader';
import '../components/filter-menu';
import '../components/footer-block';
import '../components/hero/simple-hero';
import '../components/hoverboard-icon';
import '../components/previous-speakers-block';
import '../components/text-truncate';
import { ThemedElement } from '../components/themed-element';
import { Filter } from '../models/filter';
import { FilterGroup, FilterGroupKey } from '../models/filter-group';
import { SpeakerWithTags } from '../models/speaker';
import { router } from '../router';
import { RootState } from '../store';
import { selectFilters } from '../store/filters';
import { ReduxMixin } from '../store/mixin';
import { selectFilterGroups } from '../store/sessions/selectors';
import { selectFilteredSpeakers } from '../store/speakers/selectors';
import { SpeakersState, selectSpeakersState } from '../store/speakers';
import { contentLoaders, heroSettings } from '../utils/data';
import { updateMetadata } from '../utils/metadata';

// Stable module-level reference (rather than an inline literal in
// `stateChanged`) so `selectFilterGroups`'s `createSelector` memoization
// isn't defeated by a new array on every store dispatch.
const SPEAKER_FILTER_GROUPS = [FilterGroupKey.tags];

@customElement('speakers-page')
export class SpeakersPage extends ReduxMixin(ThemedElement) {
  static override get styles() {
    return [
      ...super.styles,
      css`
        :host {
          display: block;
          height: 100%;
        }

        .container {
          display: grid;
          grid-template-columns: 1fr;
          grid-gap: 16px;
          min-height: 80%;
        }

        .speaker {
          padding: 32px 24px;
          background: var(--primary-background-color);
          text-align: center;
          transition: box-shadow var(--animation);
        }

        .speaker:hover {
          box-shadow: var(--box-shadow);
        }

        .photo {
          display: inline-block;
          --lazy-image-width: 128px;
          --lazy-image-height: 128px;
          --lazy-image-fit: cover;
          width: var(--lazy-image-width);
          height: var(--lazy-image-height);
          background-color: var(--secondary-background-color);
          border-radius: 50%;
          overflow: hidden;
          transform: translateZ(0);
        }

        .badges {
          position: absolute;
          top: 0;
          left: calc(50% + 32px);
        }

        .badge {
          margin-left: -10px;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: 2px solid #fff;
          transition: transform var(--animation);
        }

        .badge:hover {
          transform: scale(1.1);
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

        .badge-icon {
          width: 12px;
          height: 12px;
          color: #fff;
        }

        .company-logo {
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
          line-height: 1;
        }

        .origin {
          margin-top: 4px;
          font-size: 14px;
          line-height: 1.1;
        }

        .bio {
          margin-top: 16px;
          color: var(--secondary-text-color);
        }

        .contacts {
          margin-top: 16px;
        }

        .social-icon {
          padding: 6px;
          width: 32px;
          height: 32px;
          color: var(--secondary-text-color);
        }

        .progress {
          width: 100%;
          --md-linear-progress-active-indicator-color: var(--default-primary-color);
          --md-linear-progress-track-color: var(--default-primary-color);
        }

        @media (min-width: 640px) {
          .container {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (min-width: 812px) {
          .container {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        @media (min-width: 1024px) {
          .container {
            grid-template-columns: repeat(4, 1fr);
          }
        }
      `,
    ];
  }

  private heroSettings = heroSettings.speakers;
  private contentLoaders = contentLoaders;

  @property({ type: Object })
  speakers: SpeakersState = new Initialized();

  @property({ type: Array })
  filterGroups: FilterGroup[] = [];
  @property({ type: Array })
  selectedFilters: Filter[] = [];
  @property({ type: Array })
  speakersToRender: SpeakerWithTags[] = [];

  override connectedCallback() {
    super.connectedCallback();
    updateMetadata(this.heroSettings.title, this.heroSettings.metaDescription);
  }

  override stateChanged(state: RootState) {
    this.speakers = selectSpeakersState(state);
    this.filterGroups = selectFilterGroups(state, SPEAKER_FILTER_GROUPS);
    this.selectedFilters = selectFilters(state);
    this.speakersToRender = selectFilteredSpeakers(state);
  }

  private get contentLoaderVisibility() {
    return this.speakers instanceof Success;
  }

  private speakerUrl(id: string) {
    return router.urlForName('speaker-page', { id });
  }

  override render() {
    return html`
      <simple-hero page="speakers"></simple-hero>

      <md-linear-progress
        class="progress"
        indeterminate
        ?hidden=${this.contentLoaderVisibility}
      ></md-linear-progress>

      <filter-menu
        .filterGroups=${this.filterGroups}
        .selectedFilters=${this.selectedFilters}
        .resultsCount=${this.speakersToRender.length}
      ></filter-menu>

      <content-loader
        class="container"
        card-padding="32px"
        card-height="400px"
        avatar-size="128px"
        avatar-circle="64px"
        horizontal-position="50%"
        border-radius="4px"
        box-shadow="var(--box-shadow)"
        items-count=${this.contentLoaders.speakers.itemsCount}
        ?hidden=${this.contentLoaderVisibility}
      ></content-loader>

      <div class="container">
        ${this.speakersToRender.map(
          (speaker) => html`
            <a class="speaker card" href=${this.speakerUrl(speaker.id)}>
              <div relative>
                <lazy-image class="photo" src=${speaker.photoUrl} alt=${speaker.name}></lazy-image>
                <div class="badges" layout horizontal>
                  ${speaker.badges?.map(
                    (badge) => html`
                      <a
                        class="badge ${badge.name}-b"
                        href=${badge.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        title=${badge.description}
                        layout
                        horizontal
                        center-center
                      >
                        <hoverboard-icon name=${badge.name} class="badge-icon"></hoverboard-icon>
                      </a>
                    `,
                  )}
                </div>
              </div>

              <lazy-image
                class="company-logo"
                src=${speaker.companyLogoUrl}
                alt=${speaker.company}
              ></lazy-image>

              <div class="description">
                <h2 class="name">${speaker.name}</h2>
                <div class="origin">${speaker.country}</div>

                <text-truncate lines="5">
                  <div class="bio">${speaker.bio}</div>
                </text-truncate>
              </div>

              <div class="contacts">
                ${speaker.socials.map(
                  (social) => html`
                    <a href=${social.link} target="_blank" rel="noopener noreferrer">
                      <hoverboard-icon name=${social.icon} class="social-icon"></hoverboard-icon>
                    </a>
                  `,
                )}
              </div>
            </a>
          `,
        )}
      </div>

      <previous-speakers-block></previous-speakers-block>

      <footer-block></footer-block>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'speakers-page': SpeakersPage;
  }
}
