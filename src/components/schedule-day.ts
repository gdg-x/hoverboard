import { Initialized, Success } from '@abraham/remotedata';
import { RouterLocation } from '@vaadin/router';
import { css, html, PropertyValues } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { Day } from '../models/day';
import { Filter } from '../models/filter';
import { Session } from '../models/session';
import { GeneratedSessionBlock, Time } from '../models/time';
import { Timeslot } from '../models/timeslot';
import { RootState } from '../store';
import { FeaturedSessionsState, selectFeaturedSessionsState } from '../store/featured-sessions';
import { selectFilters } from '../store/filters';
import { ReduxMixin } from '../store/mixin';
import { ScheduleState, selectScheduleState } from '../store/schedule';
import { UserState } from '../store/user';
import { mySchedule } from '../utils/data';
import { generateClassName } from '../utils/styles';
import './hoverboard-icon';
import './session-element';
import { ThemedElement } from './themed-element';

@customElement('schedule-day')
export class ScheduleDay extends ReduxMixin(ThemedElement) {
  static override get styles() {
    return [
      ...super.styles,
      css`
        :host {
          display: block;
          --tracks-number: 3;
        }

        .start-time {
          margin-top: 16px;
          padding: 8px 16px;
          color: var(--secondary-text-color);
          letter-spacing: -0.04em;
          border-bottom: 1px solid var(--border-light-color);
        }

        .hours {
          font-size: 24px;
          font-weight: 300;
        }

        .minutes {
          font-size: 16px;
        }

        .add-session {
          padding: 8px;
          grid-column-end: -1 !important;
          background-color: var(--primary-background-color);
          border-bottom: 1px solid var(--border-light-color);
          font-size: 14px;
          color: var(--secondary-text-color);
        }

        .add-session:hover {
          background-color: var(--additional-background-color);
        }

        .add-session-icon {
          width: 14px;
          height: 14px;
          margin-right: 8px;
        }

        @media (min-width: 812px) {
          :host {
            margin-left: auto;
            display: block;
            max-width: calc(100% - 64px);
          }

          .grid {
            display: grid;
            grid-column-gap: 16px;
            grid-row-gap: 32px;
            grid-template-columns: repeat(var(--tracks-number), 1fr);
          }

          .start-time {
            margin: 0;
            padding: 0;
            text-align: right;
            transform: translateX(calc(-100% - 16px));
            border-bottom: 0;
          }

          .hours {
            font-size: 32px;
          }

          .subsession:not(:last-of-type) {
            margin-bottom: 16px;
          }

          .add-session {
            border: 1px solid var(--border-light-color);
          }
        }
      `,
    ];
  }

  private mySchedule = mySchedule;

  @property({ type: Object })
  schedule: ScheduleState = new Initialized();
  @property({ type: Object })
  location: RouterLocation | undefined;
  @property({ type: Object })
  day: Day | undefined;

  @property({ type: Object })
  private user: UserState = new Initialized();
  @property({ type: Object })
  private featuredSessions: FeaturedSessionsState = new Initialized();
  @property({ type: Boolean })
  onlyFeatured = false;
  @property({ type: Array })
  private selectedFilters: Filter[] = [];

  onAfterEnter(location: RouterLocation) {
    this.location = location;
  }

  override stateChanged(state: RootState) {
    this.schedule = selectScheduleState(state);
    this.user = state.user;
    this.selectedFilters = selectFilters(state);
    this.featuredSessions = selectFeaturedSessionsState(state);
  }

  override willUpdate(changedProperties: PropertyValues) {
    if (
      changedProperties.has('location') ||
      changedProperties.has('schedule') ||
      changedProperties.has('onlyFeatured')
    ) {
      this.updateDay();
    }
  }

  override render() {
    const day = this.day;

    return html`
      <div class="grid" style="--tracks-number: ${day?.tracks.length};">
        ${day?.timeslots.map(
          (timeslot, timeslotIndex) => html`
            <div
              id="${timeslot.startTime}"
              class="start-time"
              style="grid-area: ${this.getTimePosition(timeslotIndex)}"
            >
              <span class="hours">${this.splitText(timeslot.startTime, ':', 0)}</span>
              <span class="minutes">${this.splitText(timeslot.startTime, ':', 1)}</span>
            </div>

            <a
              class="add-session"
              href="/schedule/${day.date}#${timeslot.startTime}"
              ?hidden="${!this.showAddSession(timeslot, this.onlyFeatured)}"
              style="grid-area: ${
                (timeslot.sessions[0] as GeneratedSessionBlock | undefined)?.gridArea
              }"
              layout
              horizontal
              center-center
            >
              <hoverboard-icon name="add-circle-outline" class="add-session-icon"></hoverboard-icon>
              <span>${this.mySchedule.browseSession}</span>
            </a>

            ${timeslot.sessions
              .filter((sessionBlock) => this.isNotEmpty(sessionBlock))
              .map(
                (sessionBlock) => html`
                  <div
                    class="session"
                    style="grid-area: ${(sessionBlock as GeneratedSessionBlock).gridArea}"
                    layout
                    vertical
                  >
                    ${this.filterSessions(
                      (sessionBlock as GeneratedSessionBlock).items,
                      this.selectedFilters,
                    ).map(
                      (subSession) => html`
                        <session-element
                          class="subsession"
                          .session="${subSession}"
                        ></session-element>
                      `,
                    )}
                  </div>
                `,
              )}
          `,
        )}
      </div>
    `;
  }

  private getTimePosition(timeslotIndex: number) {
    return `${timeslotIndex + 1} / 1`;
  }

  private splitText(text: string, divider: string, index: number) {
    return text.split(divider)[index];
  }

  private showAddSession(timeslot: Timeslot, onlyFeatured: boolean) {
    return (
      onlyFeatured &&
      !timeslot.sessions.reduce(
        (aggregator, sessionBlock) => aggregator + sessionBlock.items.length,
        0,
      )
    );
  }

  private isNotEmpty(sessionBlock: Time) {
    return !!sessionBlock.items.length;
  }

  private filterSessions(sessions: Session[], selectedFilters: Filter[]) {
    if (selectedFilters.length === 0) {
      return sessions;
    }

    return sessions.filter((session) => {
      return selectedFilters.every((filter) => {
        const values = session[filter.group];
        if (values === undefined) {
          return false;
        } else if (typeof values === 'string') {
          return generateClassName(values) === generateClassName(filter.tag);
        } else {
          return values.some((value) => generateClassName(value) === generateClassName(filter.tag));
        }
      });
    });
  }

  private get name(): string | undefined {
    if (this.location && this.schedule instanceof Success) {
      const {
        params: { id },
        pathname,
      } = this.location;
      if (pathname.endsWith('my-schedule')) {
        return 'my-schedule';
      } else {
        return (id as string) || this.schedule.data[0]?.date;
      }
    } else {
      return undefined;
    }
  }

  private updateDay() {
    if (!this.onlyFeatured && this.name && this.schedule instanceof Success) {
      this.day = this.schedule.data.find((day) => day.date === this.name);
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'schedule-day': ScheduleDay;
  }
}
