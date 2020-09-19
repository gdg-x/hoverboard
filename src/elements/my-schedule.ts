import { customElement, observe, property } from '@polymer/decorators';
import { html, PolymerElement } from '@polymer/polymer';
import { ReduxMixin } from '../mixins/redux-mixin';
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

  @property({ type: Array })
  private schedule = [];
  @property({ type: Array })
  private featuredSchedule = [];
  @property({ type: Object })
  private featuredSessions = {};
  @property({ type: Object })
  private selectedFilters = {};
  @property({ type: String })
  private queryParams: string;
  @property({ type: Object })
  private viewport = {};
  @property({ type: Object })
  private user = {};

  @observe('schedule', 'featuredSessions')
  _filterSchedule(schedule, featuredSessions) {
    if (schedule.length) {
      this.featuredSchedule = schedule.map((day) =>
        Object.assign({}, day, {
          timeslots: day.timeslots.map((timeslot) =>
            Object.assign({}, timeslot, {
              sessions: timeslot.sessions.map((sessionBlock) =>
                Object.assign({}, sessionBlock, {
                  items: sessionBlock.items.filter((session) => featuredSessions[session.id]),
                })
              ),
            })
          ),
        })
      );
    }
  }
}
