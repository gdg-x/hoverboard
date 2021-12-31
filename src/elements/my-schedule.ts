import { Initialized } from '@abraham/remotedata';
import { customElement, observe, property } from '@polymer/decorators';
import { html, PolymerElement } from '@polymer/polymer';
import { ReduxMixin } from '../mixins/redux-mixin';
import { Day } from '../models/day';
import { Filter } from '../models/filter';
import { RootState, store } from '../store';
import { fetchUserFeaturedSessions } from '../store/featured-sessions/actions';
import { initialFeaturedSessionsState } from '../store/featured-sessions/state';
import { selectFeaturedSchedule } from '../store/schedule/selectors';
import { initialScheduleState } from '../store/schedule/state';
import { initialUserState } from '../store/user/state';
import { selectFilters } from '../store/filters/selectors';
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
          only-featured
        ></schedule-day>
      </template>
    `;
  }

  @property({ type: Object })
  private schedule = initialScheduleState;
  @property({ type: Array })
  private featuredSchedule: Day[] = [];
  @property({ type: Object })
  private featuredSessions = initialFeaturedSessionsState;
  @property({ type: Array })
  private selectedFilters: Filter[] = [];
  @property({ type: Object })
  private user = initialUserState;

  stateChanged(state: RootState) {
    this.schedule = state.schedule;
    this.user = state.user;
    this.selectedFilters = selectFilters(state);
    this.featuredSessions = state.featuredSessions;
    this.featuredSchedule = selectFeaturedSchedule(state);

    if (this.user.uid && this.featuredSessions instanceof Initialized) {
      store.dispatch(fetchUserFeaturedSessions());
    }
  }

  @observe('user.uid')
  _fetchFeaturedSessions(uid?: string) {
    if (uid && this.featuredSessions instanceof Initialized) {
      store.dispatch(fetchUserFeaturedSessions());
    }
  }
}
