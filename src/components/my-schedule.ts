import { css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { Day } from '../models/day';
import { RootState } from '../store';
import { ReduxMixin } from '../store/mixin';
import { selectFeaturedSchedule } from '../store/schedule/selectors';
import './schedule-day';
import { ThemedElement } from './themed-element';

@customElement('my-schedule')
export class MySchedule extends ReduxMixin(ThemedElement) {
  static override get styles() {
    return [
      ...super.styles,
      css`
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
      `,
    ];
  }

  @property({ type: Array })
  featuredSchedule: Day[] = [];

  override stateChanged(state: RootState) {
    this.featuredSchedule = selectFeaturedSchedule(state);
  }

  override render() {
    return html`
      ${this.featuredSchedule.map(
        (day) => html`
          <div class="date">${day.dateReadable}</div>

          <schedule-day name="${day.date}" .day="${day}" .onlyFeatured="${true}"></schedule-day>
        `,
      )}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'my-schedule': MySchedule;
  }
}
