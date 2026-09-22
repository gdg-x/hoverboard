import { Initialized, Pending, Success } from '@abraham/remotedata';
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
import { RootState, store } from '../store';
import { selectFilters } from '../store/filters/selectors';
import { ReduxMixin } from '../store/mixin';
import { fetchSchedule } from '../store/schedule/actions';
import { initialScheduleState } from '../store/schedule/state';
import { fetchSessions } from '../store/sessions/actions';
import { selectFilterGroups } from '../store/sessions/selectors';
import { initialSessionsState } from '../store/sessions/state';
import { fetchSpeakers } from '../store/speakers/actions';
import { initialSpeakersState } from '../store/speakers/state';
import { TempAny } from '../temp-any';
import { contentLoaders, heroSettings } from '../utils/data';
import { updateMetadata } from '../utils/metadata';

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

  private heroSettings = heroSettings.schedule;
  private contentLoaders = contentLoaders.schedule;

  @property({ type: Object })
  schedule = initialScheduleState;
  @property({ type: Object })
  sessions = initialSessionsState;
  @property({ type: Object })
  speakers = initialSpeakersState;

  @state()
  private filterGroups: FilterGroup[] = [];
  @state()
  private selectedFilters: Filter[] = [];
  @state()
  private location: RouterLocation | undefined;

  override connectedCallback() {
    super.connectedCallback();
    updateMetadata(this.heroSettings.title, this.heroSettings.metaDescription);

    if (this.sessions instanceof Initialized) {
      store.dispatch(fetchSessions);
    }

    if (this.speakers instanceof Initialized) {
      store.dispatch(fetchSpeakers);
    }
  }

  override stateChanged(state: RootState) {
    this.schedule = state.schedule;
    this.speakers = state.speakers;
    this.sessions = state.sessions;
    this.filterGroups = selectFilterGroups(state);
    this.selectedFilters = selectFilters(state);
  }

  onAfterEnter(location: RouterLocation) {
    this.location = location;
  }

  override updated(changed: Map<string, unknown>) {
    if (changed.has('sessions') || changed.has('speakers')) {
      this.onSessionsAndSpeakersChanged();
    }
  }

  private onSessionsAndSpeakersChanged() {
    if (
      this.schedule instanceof Initialized &&
      this.sessions instanceof Success &&
      this.speakers instanceof Success
    ) {
      store.dispatch(fetchSchedule);
    }
  }

  private get pending() {
    return this.schedule instanceof Pending;
  }

  override render() {
    return html`
      <hero-block
        background-image="${(this.heroSettings.background as TempAny).image ?? ''}"
        background-color="${this.heroSettings.background.color}"
        font-color="${this.heroSettings.fontColor}"
      >
        <div class="hero-title">${this.heroSettings.title}</div>
        <p class="hero-description">${(this.heroSettings as TempAny).description ?? ''}</p>
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
