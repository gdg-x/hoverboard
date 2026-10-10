import { msg, str } from '@lit/localize';
import { css, html, nothing } from 'lit';
import { customElement } from 'lit/decorators.js';
import { attendingPage, timeZone } from '../../config/site';
import { getLocale } from '../../utils/localization';
import { ThemedComponent } from '../themed-component';
import { contentStyles, markdown } from './content';

// Days and times at the venue, with no time zone of their own, so they are read and shown as UTC.
const formatDay = (day: string) =>
  new Intl.DateTimeFormat(getLocale(), {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${day}T00:00:00Z`));

const formatHours = (open: string, close: string) =>
  new Intl.DateTimeFormat(getLocale(), {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'UTC',
  }).formatRange(new Date(`1970-01-01T${open}:00Z`), new Date(`1970-01-01T${close}:00Z`));

/** When the doors open and close each day, at the venue's time. Without days, it renders nothing. */
@customElement('doors-section')
export class DoorsSection extends ThemedComponent {
  static override styles = [
    contentStyles,
    css`
      .days {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));
        gap: var(--hb-space-6);
        margin: var(--hb-space-6) 0 0;
        padding: 0;
        list-style: none;
      }

      .day h3 {
        margin: 0;
        font: 700 var(--hb-text-md) / 1.3 var(--hb-font-body);
      }

      .hours {
        margin: var(--hb-space-1) 0 0;
        font: 700 var(--hb-text-xl) / 1.2 var(--hb-font-display);
      }

      .day .text {
        margin-block-start: var(--hb-space-2);
      }

      .time-zone {
        margin: var(--hb-space-6) 0 0;
      }
    `,
  ];

  override render() {
    const doors = attendingPage?.doors ?? [];
    if (!doors.length) return nothing;
    return html`
      <slot name="heading"></slot>
      <ul class="days">
        ${doors.map(
          ({ day, open, close, note }) => html`
            <li class="day">
              <h3>${formatDay(day)}</h3>
              <p class="hours">${formatHours(open, close)}</p>
              ${markdown(note)}
            </li>
          `,
        )}
      </ul>
      <p class="time-zone">
        ${msg(str`Times are at the venue, in ${timeZone.replaceAll('_', ' ')}.`, {
          id: 'attending.doors.time-zone',
        })}
      </p>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'doors-section': DoorsSection;
  }
}
