import { Pending } from '@abraham/remotedata';
import '@material/web/progress/linear-progress.js';
import { css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import '../components/hero/hero-block';
import '../components/shared/content-loader';
import '../components/shared/filter-menu';
import '../components/schedule/header-bottom-toolbar';
import '../components/schedule/sticky-element';
import type { Filter } from '../models/filter';
import type { FilterGroup } from '../models/filter-group';
import type { RouteLocation } from '../router';
import { selectFilters } from '../store/filters';
import { type ScheduleState, selectScheduleState } from '../store/schedule';
import { selectFilterGroups } from '../store/sessions/selectors';
import { type SessionsState, selectSessionsState } from '../store/sessions';
import { type SpeakersState, selectSpeakersState } from '../store/speakers';
import { contentLoaders, heroDescriptions } from '../config/site';
import { PageMetadataController } from '../controllers/page-metadata-controller';
import { pageText } from '../utils/page-text';
import { fromStore } from '../controllers/from-store';
import { ThemedElement } from '../components/themed-element';

@customElement('schedule-page')
export class SchedulePage extends ThemedElement {
  static override styles = css`
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
        background-color: var(--primary-background-color);
      }
    }
  `;

  private readonly metadata = new PageMetadataController(this, 'schedule');
  private contentLoaders = contentLoaders.schedule;

  @fromStore((state) => selectScheduleState(state))
  accessor schedule!: ScheduleState;
  @fromStore((state) => selectSessionsState(state))
  accessor sessions!: SessionsState;
  @fromStore((state) => selectSpeakersState(state))
  accessor speakers!: SpeakersState;

  @fromStore((state) => selectFilterGroups(state))
  private accessor filterGroups!: FilterGroup[];
  @fromStore((state) => selectFilters(state))
  private accessor selectedFilters!: Filter[];
  @property({ attribute: false })
  accessor location: RouteLocation | undefined;

  private get pending() {
    return this.schedule instanceof Pending;
  }

  override render() {
    // A site can give the schedule page a description in content/resources.json.
    const { schedule: description } = heroDescriptions as { schedule?: string };
    return html`
      <hero-block>
        <div class="hero-title">${pageText('schedule').title}</div>
        <p class="hero-description">${description ?? ''}</p>
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
        >
        </content-loader>

        <slot></slot>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'schedule-page': SchedulePage;
  }
}
