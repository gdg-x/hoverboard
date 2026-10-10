import { msg } from '@lit/localize';
import { css, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { Session } from '../../models/session';
import { url } from '../../config/site';
import { sessionPath } from '../../utils/navigation';
import { downloadIcs, googleCalendarUrl, sessionToCalendarEvent } from '../../utils/calendar';
import { ThemedComponent } from '../themed-component';
import '../ui/hb-button';
import '../ui/hb-menu';
import './hoverboard-icon';

@customElement('add-to-calendar')
export class AddToCalendar extends ThemedComponent {
  static override styles = css`
    :host {
      display: inline-block;
    }
  `;

  @property({ type: Object })
  accessor session: (Session & { endTime?: string }) | undefined;

  private get event() {
    if (!this.session) return undefined;
    const path = sessionPath(this.session.id);
    return sessionToCalendarEvent(this.session, new URL(path.slice(1), url).href);
  }

  private download = () => {
    const event = this.event;
    if (event && this.session) {
      downloadIcs(event, this.session.id);
    }
  };

  override render() {
    const event = this.event;
    if (!event) {
      return nothing;
    }

    return html`
      <hb-menu>
        <hb-button slot="trigger" variant="outlined">
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
