import { Initialized, Success } from '@abraham/remotedata';
import { computed, customElement, observe, property } from '@polymer/decorators';
import '@polymer/iron-icon';
import { html, PolymerElement } from '@polymer/polymer';
import { RouterLocation } from '@vaadin/router';
import { Day } from '../models/day';
import { Filter } from '../models/filter';
import { Session } from '../models/session';
import { Time } from '../models/time';
import { Timeslot } from '../models/timeslot';
import { RootState, store } from '../store';
import { fetchUserFeaturedSessions } from '../store/featured-sessions/actions';
import { initialFeaturedSessionsState } from '../store/featured-sessions/state';
import { selectFilters } from '../store/filters/selectors';
import { ReduxMixin } from '../store/mixin';
import { initialScheduleState, ScheduleState } from '../store/schedule/state';
import { initialUserState } from '../store/user/state';
import { UserState } from '../store/user/types';
import { mySchedule } from '../utils/data';
import '../utils/icons';
import { generateClassName } from '../utils/styles';
import './session-element';
import './shared-styles';

@customElement('schedule-day')
export class ScheduleDay extends ReduxMixin(PolymerElement) {
  static get template() {
    return html`
      <style include="shared-styles flex flex-alignment positioning">
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
          --iron-icon-width: 14px;
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
      </style>

      <div class="grid" style$="--tracks-number: [[day.tracks.length]];">
        <template is="dom-repeat" items="[[day.timeslots]]" as="timeslot" index-as="timeslotIndex">
          <div
            id$="[[timeslot.startTime]]"
            class="start-time"
            style$="grid-area: [[getTimePosition(timeslotIndex)]]"
          >
            <span class="hours">[[splitText(timeslot.startTime, ':', 0)]]</span>
            <span class="minutes">[[splitText(timeslot.startTime, ':', 1)]]</span>
          </div>

          <a
            class="add-session"
            href$="/schedule/[[day.date]]#[[timeslot.startTime]]"
            hidden$="[[!showAddSession(timeslot, onlyFeatured)]]"
            style$="grid-area: [[timeslot.sessions.0.gridArea]]"
            layout
            horizontal
            center-center
          >
            <iron-icon icon="hoverboard:add-circle-outline class="add-session-icon""></iron-icon>
            <span>[[mySchedule.browseSession]]</span>
          </a>

          <template
            is="dom-repeat"
            items="[[timeslot.sessions]]"
            as="session"
            index-as="sessionIndex"
            filter="isNotEmpty"
          >
            <div class="session" style$="grid-area: [[session.gridArea]]" layout vertical>
              <template
                is="dom-repeat"
                items="[[filterSessions(session.items, selectedFilters)]]"
                as="subSession"
              >
                <session-element
                  class="subsession"
                  day-name="[[name]]"
                  session="[[subSession]]"
                ></session-element>
              </template>
            </div>
          </template>
        </template>
      </div>
    `;
  }

  private mySchedule = mySchedule;

  @property({ type: Object })
  schedule: ScheduleState = initialScheduleState;
  @property({ type: Object })
  location: RouterLocation | undefined;
  @property({ type: Object })
  private day: Day | undefined;

  @property({ type: Object })
  private user = initialUserState;
  @property({ type: Object })
  private featuredSessions = initialFeaturedSessionsState;
  @property({ type: Boolean })
  private onlyFeatured = false;
  @property({ type: Array })
  private selectedFilters: Filter[] = [];

  onAfterEnter(location: RouterLocation) {
    this.location = location;
  }

  override stateChanged(state: RootState) {
    this.schedule = state.schedule;
    this.user = state.user;
    this.selectedFilters = selectFilters(state);
    this.featuredSessions = state.featuredSessions;
  }

  @observe('user')
  private onUser(user: UserState) {
    if (user instanceof Success && this.featuredSessions instanceof Initialized) {
      store.dispatch(fetchUserFeaturedSessions);
    }
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
        0
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

  @computed('location', 'schedule')
  private get name() {
    if (this.location && this.schedule instanceof Success) {
      const {
        params: { id },
        pathname,
      } = this.location;
      if (pathname.endsWith('my-schedule')) {
        return 'my-schedule';
      } else {
        return id || this.schedule.data[0]?.date;
      }
    } else {
      return undefined;
    }
  }

  @observe('name', 'schedule')
  private onNameAndSchedule() {
    if (!this.onlyFeatured && this.name && this.schedule instanceof Success) {
      this.day = this.schedule.data.find((day) => day.date === this.name);
    }
  }
}
