import { Success } from '@abraham/remotedata';
import { customElement, observe, property } from '@polymer/decorators';
import { html, PolymerElement } from '@polymer/polymer';
import { ReduxMixin } from '../mixins/redux-mixin';
import { Schedule } from '../models/schedule';
import {
  FeaturedSessionsState,
  initialFeaturedSessionsState,
} from '../store/featured-sessions/state';
import { initialScheduleState, ScheduleState } from '../store/schedule/state';
import './schedule-day';
import './shared-styles';

@customElement('my-schedule')
export class MySchedule extends ReduxMixin(PolymerElement) {
  static get template() {
    return html`
      <style include="shared-styles flex flex-alignment">
        :host {
          display: block;
        }

        .date {
          margin: 16px;
          font-size: 24px;
        }

        .date:not(:first-of-type) {
          margin-top: 64px;
        }

        @media (min-width: 640px) {
          .date {
            margin-left: 64px;
            font-size: 32px;
          }
        }
      </style>

      <template is="dom-repeat" items="[[featuredSchedule]]" as="day">
        <div class="date">[[day.dateReadable]]</div>

        <schedule-day
          name$="[[day.date]]"
          day="[[day]]"
          user="[[user]]"
          featured-sessions="[[featuredSessions]]"
          selected-filters="[[selectedFilters]]"
          viewport="[[viewport]]"
          query-params="[[queryParams]]"
          only-featured
        ></schedule-day>
      </template>
    `;
  }

  @property({ type: Object })
  private schedule: ScheduleState = initialScheduleState;
  @property({ type: Array })
  private featuredSchedule = [];
  @property({ type: Object })
  private featuredSessions: FeaturedSessionsState = initialFeaturedSessionsState;
  @property({ type: Object })
  private selectedFilters = {};
  @property({ type: String })
  private queryParams: string;
  @property({ type: Object })
  private viewport = {};
  @property({ type: Object })
  private user = {};

  @observe('schedule', 'featuredSessions')
  _filterSchedule(schedule: Schedule, featuredSessions: FeaturedSessionsState) {
    if (schedule instanceof Success && featuredSessions instanceof Success) {
      this.featuredSchedule = schedule.data.map((day) =>
        Object.assign({}, day, {
          timeslots: day.timeslots.map((timeslot) =>
            Object.assign({}, timeslot, {
              sessions: timeslot.sessions.map((sessionBlock) =>
                Object.assign({}, sessionBlock, {
                  items: sessionBlock.items.filter((session) => featuredSessions.data[session.id]),
                })
              ),
            })
          ),
        })
      );
    }
  }
}
