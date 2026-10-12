import { msg } from '@lit/localize';
import { css, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import type { Session } from '../../models/session';
import { url } from '../../config/site';
import { sessionPath } from '../../utils/navigation';
import {
  type CalendarEvent,
  downloadIcs,
  googleCalendarUrl,
  sessionToCalendarEvent,
} from '../../utils/calendar';
import { ThemedComponent } from '../themed-component';
import '../ui/hb-button';
import '../ui/hb-menu';
import './hoverboard-icon';

/** A menu that adds a session, or with `event` and `uid` any calendar event, to a calendar. */
@customElement('add-to-calendar')
export class AddToCalendar extends ThemedComponent {
  static override styles = css`
    :host {
      display: inline-block;
    }
  `;

  @property({ type: Object })
  accessor session: (Session & { endTime?: string }) | undefined;

  /** An event other than a session. */
  @property({ attribute: false })
  accessor event: CalendarEvent | undefined;

  /** The event's unique ID, and the name of its `.ics` file. */
  @property()
  accessor uid: string | undefined;

  @property()
  accessor size: 'l' | undefined;

  private get calendarEvent() {
    if (this.event) return this.event;
    if (!this.session) return undefined;
    const path = sessionPath(this.session.id);
    return sessionToCalendarEvent(this.session, new URL(path.slice(1), url).href);
  }

  private download = () => {
    const event = this.calendarEvent;
    const uid = this.uid ?? this.session?.id;
    if (event && uid) downloadIcs([[event, uid]], uid);
  };

  override render() {
    const event = this.calendarEvent;
    if (!event) {
      return nothing;
    }

    return html`
      <hb-menu>
        <hb-button slot="trigger" variant="outlined" size="${ifDefined(this.size)}">
          <hoverboard-icon slot="icon" name="calendar"></hoverboard-icon>
          ${msg('Add to calendar', { id: 'shared.add-to-calendar.label' })}
        </hb-button>
        <a
          role="menuitem"
          href="${googleCalendarUrl(event)}"
          target="_blank"
          rel="noopener noreferrer"
        >
          ${msg('Google Calendar', { id: 'shared.add-to-calendar.google' })}
        </a>
        <button role="menuitem" type="button" @click="${this.download}">
          ${msg('Apple Calendar', {
            id: 'shared.add-to-calendar.apple',
            desc: 'Downloads an .ics file for Apple Calendar and other calendar apps.',
          })}
        </button>
      </hb-menu>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'add-to-calendar': AddToCalendar;
  }
}
