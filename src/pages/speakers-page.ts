import { Initialized, Success } from '@abraham/remotedata';
import { computed, customElement, property } from '@polymer/decorators';
import '@polymer/iron-icon';
import '@polymer/paper-icon-button';
import '@polymer/paper-progress';
import { html, PolymerElement } from '@polymer/polymer';
import '@power-elements/lazy-image';
import '../components/hero/simple-hero';
import '../components/text-truncate';
import '../elements/content-loader';
import '../elements/filter-menu';
import '../elements/previous-speakers-block';
import '../elements/shared-styles';
import { Filter } from '../models/filter';
import { FilterGroup, FilterGroupKey } from '../models/filter-group';
import { SpeakerWithTags } from '../models/speaker';
import { router } from '../router';
import { RootState, store } from '../store';
import { selectFilters } from '../store/filters/selectors';
import { ReduxMixin } from '../store/mixin';
import { selectFilterGroups } from '../store/sessions/selectors';
import { fetchSpeakers } from '../store/speakers/actions';
import { selectFilteredSpeakers } from '../store/speakers/selectors';
import { initialSpeakersState } from '../store/speakers/state';
import { contentLoaders, heroSettings } from '../utils/data';
import '../utils/icons';
import { updateMetadata } from '../utils/metadata';

@customElement('speakers-page')
export class SpeakersPage extends ReduxMixin(PolymerElement) {
  static get template() {
    return html`
      <style include="shared-styles flex flex-alignment positioning">
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
          --iron-icon-width: 12px;
          --iron-icon-height: 12px;
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
          --paper-icon-button: {
            padding: 6px;
            width: 32px;
            height: 32px;
          }
          color: var(--secondary-text-color);
        }

        paper-progress {
          width: 100%;
          --paper-progress-active-color: var(--default-primary-color);
          --paper-progress-secondary-color: var(--default-primary-color);
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
      </style>

      <simple-hero page="speakers"></simple-hero>

      <paper-progress indeterminate hidden$="[[contentLoaderVisibility]]"></paper-progress>

      <filter-menu
        filter-groups="[[filterGroups]]"
        selected-filters="[[selectedFilters]]"
        results-count="[[speakersToRender.length]]"
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
        items-count="[[contentLoaders.speakers.itemsCount]]"
        hidden$="[[contentLoaderVisibility]]"
      ></content-loader>

      <div class="container">
        <template is="dom-repeat" items="[[speakersToRender]]" as="speaker">
          <a class="speaker card" href$="[[speakerUrl(speaker.id)]]">
            <div relative>
              <lazy-image
                class="photo"
                src="[[speaker.photoUrl]]"
                alt="[[speaker.name]]"
              ></lazy-image>
              <div class="badges" layout horizontal>
                <template is="dom-repeat" items="[[speaker.badges]]" as="badge">
                  <a
                    class$="badge [[badge.name]]-b"
                    href$="[[badge.link]]"
                    target="_blank"
                    rel="noopener noreferrer"
                    title$="[[badge.description]]"
                    layout
                    horizontal
                    center-center
                  >
                    <iron-icon icon="hoverboard:[[badge.name]]" class="badge-icon"></iron-icon>
                  </a>
                </template>
              </div>
            </div>

            <lazy-image
              class="company-logo"
              src="[[speaker.companyLogoUrl]]"
              alt="[[speaker.company]]"
            ></lazy-image>

            <div class="description">
              <h2 class="name">[[speaker.name]]</h2>
              <div class="origin">[[speaker.country]]</div>

              <text-truncate lines="5">
                <div class="bio">[[speaker.bio]]</div>
              </text-truncate>
            </div>

            <div class="contacts">
              <template is="dom-repeat" items="[[speaker.socials]]" as="social">
                <a href$="[[social.link]]" target="_blank" rel="noopener noreferrer">
                  <paper-icon-button
                    class="social-icon"
                    icon="hoverboard:{{social.icon}}"
                  ></paper-icon-button>
                </a>
              </template>
            </div>
          </a>
        </template>
      </div>

      <previous-speakers-block></previous-speakers-block>

      <footer-block></footer-block>
    `;
  }

  private heroSettings = heroSettings.speakers;
  private contentLoaders = contentLoaders;

  @property({ type: Object })
  speakers = initialSpeakersState;

  @property({ type: Array })
  private filterGroups: FilterGroup[] = [];
  @property({ type: Array })
  private selectedFilters: Filter[] = [];
  @property({ type: Array })
  private speakersToRender: SpeakerWithTags[] = [];

  override connectedCallback() {
    super.connectedCallback();
    updateMetadata(this.heroSettings.title, this.heroSettings.metaDescription);

    if (this.speakers instanceof Initialized) {
      store.dispatch(fetchSpeakers);
    }
  }

  override stateChanged(state: RootState) {
    super.stateChanged(state);
    this.speakers = state.speakers;
    this.filterGroups = selectFilterGroups(state, [FilterGroupKey.tags]);
    this.selectedFilters = selectFilters(state);
    this.speakersToRender = selectFilteredSpeakers(state);
  }

  @computed('speakers')
  get contentLoaderVisibility() {
    return this.speakers instanceof Success;
  }

  speakerUrl(id: string) {
    return router.urlForName('speaker-page', { id });
  }
}
