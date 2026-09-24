import { css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { Day } from '../models/day';
import { RootState } from '../store';
import { ReduxMixin } from '../store/mixin';
import { selectFeaturedSchedule } from '../store/schedule/selectors';
import { schedule } from '../utils/data';
import './auth-required';
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

        auth-required {
          --mdc-theme-primary: var(--default-primary-color);
          display: block;
        }

        .sign-in-prompt {
          margin: 16px;
        }

        .date {
          margin: 16px;
          font-size: 24px;
        }

        .date:not(:first-of-type) {
          margin-top: 64px;
        }

        @media (min-width: 640px) {
          .sign-in-prompt {
            margin-left: 64px;
          }

          .date {
            margin-left: 64px;
            font-size: 32px;
          }
        }
      `,
    ];
  }

  private schedule = schedule;

  @property({ type: Array })
  featuredSchedule: Day[] = [];

  override stateChanged(state: RootState) {
    this.featuredSchedule = selectFeaturedSchedule(state);
  }

  override render() {
    return html`
      <auth-required>
        <p slot="prompt" class="sign-in-prompt">${this.schedule.saveSessionsSignedOut}</p>

        ${this.featuredSchedule.map(
          (day) => html`
            <div class="date">${day.dateReadable}</div>

            <schedule-day name="${day.date}" .day="${day}" .onlyFeatured="${true}"></schedule-day>
          `,
        )}
      </auth-required>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'my-schedule': MySchedule;
  }
}
