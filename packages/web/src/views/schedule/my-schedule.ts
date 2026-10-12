import { msg } from '@lit/localize';
import { css, html, nothing } from 'lit';
import { displayFont } from '../../styles/shared';
import { customElement } from 'lit/decorators.js';
import type { BuiltDay, BuiltSession } from '../../schedule/build-schedule';
import { selectFeaturedSchedule } from '../../store/schedule/selectors';
import { url } from '../../config/site';
import { type CalendarEvent, downloadIcs, sessionToCalendarEvent } from '../../utils/calendar';
import { getScheduleDay } from '../../utils/dates';
import { sessionPath } from '../../utils/navigation';
import '../../components/shared/auth-required';
import '../../components/shared/hoverboard-icon';
import '../../components/ui/hb-button';
import './schedule-day';
import { fromStore } from '../../controllers/from-store';
import { ThemedComponent } from '../../components/themed-component';
import { illustration, illustrationStyles } from '../../illustrations/illustration';
import emptySchedule from '../../illustrations/empty-schedule.svg?raw';

/** The signed-in visitor's saved sessions, day by day. */
@customElement('my-schedule')
export class MySchedule extends ThemedComponent {
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
        ${displayFont('display', '3xl', 1.1)};
      }

      .date:first-of-type {
        margin-block-start: var(--hb-space-4);
      }

      .export {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--hb-space-1) var(--hb-space-4);
        margin-block-start: var(--hb-space-4);
      }

      .export .hint {
        margin: 0;
        color: var(--hb-color-on-surface-variant);
        font-size: var(--hb-text-sm);
      }
    `,
  ];

  @fromStore((state) => selectFeaturedSchedule(state))
  accessor featuredSchedule!: BuiltDay[];

  private get savedSessions(): BuiltSession[] {
    const sessions = this.featuredSchedule.flatMap((day) =>
      day.timeslots.flatMap((timeslot) => timeslot.sessions.flatMap((block) => block.items)),
    );
    return sessions.filter(
      (session, index) => sessions.findIndex(({ id }) => id === session.id) === index,
    );
  }

  private readonly download = () => {
    const events = this.savedSessions.flatMap((session) => {
      const page = new URL(sessionPath(session.id).slice(1), url).href;
      const event = sessionToCalendarEvent(session, page);
      return event ? [[event, session.id] as [CalendarEvent, string]] : [];
    });
    downloadIcs(events, 'my-schedule');
  };

  override render() {
    const saved = this.savedSessions.length > 0;
    return html`
      <auth-required>
        <p slot="prompt" class="prompt">
          ${msg('Sign in to save sessions', { id: 'common.save-sessions-signed-out' })}
        </p>

        ${
          saved
            ? html`<div class="export">
                <hb-button variant="outlined" @click="${this.download}">
                  <hoverboard-icon slot="icon" name="calendar"></hoverboard-icon>
                  ${msg('Add my sessions to calendar', { id: 'schedule.my-schedule.export' })}
                </hb-button>
                <p class="hint">
                  ${msg(
                    "Downloads your sessions as they are now. Your calendar won't follow later changes to the schedule.",
                    { id: 'schedule.my-schedule.export-hint' },
                  )}
                </p>
              </div>`
            : nothing
        }
        ${
          saved || !this.featuredSchedule.length
            ? nothing
            : html`<div class="empty">
                ${illustration(emptySchedule)}
                <p class="hint">
                  ${msg('Save sessions in the schedule to see them here.', {
                    id: 'schedule.my-schedule.empty',
                  })}
                </p>
              </div>`
        }
        ${this.featuredSchedule.map(
          (day) => html`
            <h2 class="date">${getScheduleDay(day.date)}</h2>
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
