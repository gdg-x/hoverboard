import { msg } from '@lit/localize';
import { css, html, nothing } from 'lit';
import { customElement } from 'lit/decorators.js';
import type { Day } from '../../models/day';
import { selectFeaturedSchedule } from '../../store/schedule/selectors';
import '../../components/shared/auth-required';
import './schedule-day';
import { fromStore } from '../../controllers/from-store';
import { ThemedElement } from '../../components/themed-element';
import { illustration, illustrationStyles } from '../../illustrations/illustration';
import emptySchedule from '../../illustrations/empty-schedule.svg?raw';

/** The signed-in visitor's bookmarked sessions, day by day. */
@customElement('my-schedule')
export class MySchedule extends ThemedElement {
  static override styles = [
    illustrationStyles,
    css`
      :host {
        display: block;
      }

      .empty {
        display: grid;
        justify-items: start;
        gap: var(--hb-space-4);
        margin-block: var(--hb-space-6);
      }

      .empty .illustration {
        inline-size: min(100%, 16rem);
      }

      auth-required {
        display: block;
      }

      .prompt,
      .hint {
        margin: var(--hb-space-3) 0;
        max-inline-size: var(--hb-prose-max);
      }

      .date {
        margin: var(--hb-space-7) 0 var(--hb-space-3);
        padding: 0;
        font: 800 var(--hb-text-3xl) / 1.1 var(--hb-font-display);
      }

      .date:first-of-type {
        margin-block-start: var(--hb-space-4);
      }
    `,
  ];

  @fromStore((state) => selectFeaturedSchedule(state))
  accessor featuredSchedule!: Day[];

  override render() {
    const bookmarks = this.featuredSchedule.some((day) =>
      day.timeslots.some((timeslot) => timeslot.sessions.some((block) => block.items.length)),
    );
    return html`
      <auth-required>
        <p slot="prompt" class="prompt">
          ${msg('Sign in to save sessions', { id: 'common.save-sessions-signed-out' })}
        </p>

        ${
          bookmarks || !this.featuredSchedule.length
            ? nothing
            : html`<div class="empty">
                ${illustration(emptySchedule)}
                <p class="hint">
                  ${msg('Bookmark sessions in the schedule to see them here.', {
                    id: 'schedule.my-schedule.empty',
                  })}
                </p>
              </div>`
        }
        ${this.featuredSchedule.map(
          (day) => html`
            <h2 class="date">${day.dateReadable}</h2>
            <schedule-day .day="${day}" .onlyFeatured="${true}"></schedule-day>
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
