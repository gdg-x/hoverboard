import { Initialized, Pending } from '@abraham/remotedata';
import '@material/web/progress/linear-progress.js';
import { css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { RouterLocation } from '@vaadin/router';
import '../components/hero/hero-block';
import '../components/content-loader';
import '../components/filter-menu';
import '../components/footer-block';
import '../components/header-bottom-toolbar';
import '../components/sticky-element';
import { ThemedElement } from '../components/themed-element';
import { Filter } from '../models/filter';
import { FilterGroup } from '../models/filter-group';
import { RootState } from '../store';
import { selectFilters } from '../store/filters';
import { ReduxMixin } from '../store/mixin';
import { ScheduleState, selectScheduleState } from '../store/schedule';
import { selectFilterGroups } from '../store/sessions/selectors';
import { SessionsState, selectSessionsState } from '../store/sessions';
import { SpeakersState, selectSpeakersState } from '../store/speakers';
import { contentLoaders, heroSettings } from '../utils/data';
import { updateMetadata } from '../utils/metadata';

// `heroSettings.schedule` (from `settings.json`) doesn't declare a `background.image`
// or a top-level `description` — unlike some other hero settings entries (e.g.
// `heroSettings.home`). Model them as optional here instead of casting to `any`.
interface ScheduleHeroSettings {
  background: {
    color: string;
    image?: string;
  };
  description?: string;
  fontColor: string;
  metaDescription: string;
  title: string;
}

@customElement('schedule-page')
export class SchedulePage extends ReduxMixin(ThemedElement) {
  static override get styles() {
    return [
      ...super.styles,
      css`
        :host {
          display: block;
          height: 100%;
        }

        .container {
          min-height: 80%;
        }

        .progress {
          width: 100%;
          --md-linear-progress-active-indicator-color: var(--default-primary-color);
          --md-linear-progress-track-color: var(--default-primary-color);
        }

        @media (max-width: 640px) {
          .container {
            padding: 0 0 32px;
          }
        }

        @media (min-width: 640px) {
          :host {
            background-color: #fff;
          }
        }
      `,
    ];
  }

  private heroSettings: ScheduleHeroSettings = heroSettings.schedule;
  private contentLoaders = contentLoaders.schedule;

  @property({ type: Object })
  schedule: ScheduleState = new Initialized();
  @property({ type: Object })
  sessions: SessionsState = new Initialized();
  @property({ type: Object })
  speakers: SpeakersState = new Initialized();

  @state()
  private filterGroups: FilterGroup[] = [];
  @state()
  private selectedFilters: Filter[] = [];
  @state()
  private location: RouterLocation | undefined;

  override connectedCallback() {
    super.connectedCallback();
    updateMetadata(this.heroSettings.title, this.heroSettings.metaDescription);
  }

  override stateChanged(state: RootState) {
    this.schedule = selectScheduleState(state);
    this.speakers = selectSpeakersState(state);
    this.sessions = selectSessionsState(state);
    this.filterGroups = selectFilterGroups(state);
    this.selectedFilters = selectFilters(state);
  }

  onAfterEnter(location: RouterLocation) {
    this.location = location;
  }

  private get pending() {
    return this.schedule instanceof Pending;
  }

  override render() {
    return html`
      <hero-block
        background-image="${this.heroSettings.background.image ?? ''}"
        background-color="${this.heroSettings.background.color}"
        font-color="${this.heroSettings.fontColor}"
      >
        <div class="hero-title">${this.heroSettings.title}</div>
        <p class="hero-description">${this.heroSettings.description ?? ''}</p>
        <sticky-element slot="bottom">
          <header-bottom-toolbar .location="${this.location}"></header-bottom-toolbar>
        </sticky-element>
      </hero-block>

      <md-linear-progress
        class="progress"
        indeterminate
        ?hidden="${!this.pending}"
      ></md-linear-progress>

      <filter-menu
        .filterGroups="${this.filterGroups}"
        .selectedFilters="${this.selectedFilters}"
      ></filter-menu>

      <div class="container">
        <content-loader
          card-padding="15px"
          card-margin="16px 0"
          card-height="140px"
          avatar-size="0"
          avatar-circle="0"
          title-top-position="20px"
          title-height="42px"
          title-width="70%"
          load-from="-20%"
          load-to="80%"
          blur-width="300px"
          items-count="${this.contentLoaders.itemsCount}"
          ?hidden="${!this.pending}"
          layout
        >
        </content-loader>

        <slot></slot>
      </div>

      <footer-block></footer-block>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'schedule-page': SchedulePage;
  }
}
