import { customElement, property } from '@polymer/decorators';
import { html, PolymerElement } from '@polymer/polymer';
import { Day } from '../models/day';
import { RootState } from '../store';
import { ReduxMixin } from '../store/mixin';
import { selectFeaturedSchedule } from '../store/schedule/selectors';
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

        <schedule-day name$="[[day.date]]" day="[[day]]" only-featured></schedule-day>
      </template>
    `;
  }

  @property({ type: Array })
  private featuredSchedule: Day[] = [];

  override stateChanged(state: RootState) {
    this.featuredSchedule = selectFeaturedSchedule(state);
  }
}
