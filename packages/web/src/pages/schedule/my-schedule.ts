import { msg } from '@lit/localize';
import { css, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import type { Day } from '../../models/day';
import { selectFeaturedSchedule } from '../../store/schedule/selectors';
import '../../components/shared/auth-required';
import './schedule-day';
import { fromStore } from '../../controllers/from-store';
import { ThemedElement } from '../../components/themed-element';

@customElement('my-schedule')
export class MySchedule extends ThemedElement {
  static override styles = css`
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
  `;

  @fromStore((state) => selectFeaturedSchedule(state))
  accessor featuredSchedule!: Day[];

  override render() {
    return html`
      <auth-required>
        <p slot="prompt" class="sign-in-prompt">
          ${msg('Sign in to save sessions', { id: 'common.save-sessions-signed-out' })}
        </p>

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
