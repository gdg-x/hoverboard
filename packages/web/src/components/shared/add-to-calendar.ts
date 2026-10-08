import { msg } from '@lit/localize';
import '@material/web/button/outlined-button.js';
import '@material/web/menu/menu.js';
import '@material/web/menu/menu-item.js';
import type { MdMenu } from '@material/web/menu/menu.js';
import { css, html, nothing } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import type { Session } from '../../models/session';
import { url } from '../../config/site';
import { router } from '../../router';
import {
  type CalendarEvent,
  downloadIcs,
  googleCalendarUrl,
  sessionToCalendarEvent,
} from '../../utils/calendar';
import { ThemedElement } from '../themed-element';
import './hoverboard-icon';

@customElement('add-to-calendar')
export class AddToCalendar extends ThemedElement {
  static override styles = css`
    :host {
      position: relative;
      display: inline-block;
    }
  `;

  @property({ type: Object })
  accessor session: (Session & { endTime?: string }) | undefined;

  @query('md-menu')
  private accessor menu!: MdMenu;

  // The menu items do not hydrate, so the menu renders only after the first update.
  @state()
  private accessor menuReady = false;

  override firstUpdated() {
    this.menuReady = true;
  }

  private get event() {
    if (!this.session) return undefined;
    const path = router.urlForName('session-page', { id: this.session.id });
    return sessionToCalendarEvent(this.session, new URL(path.slice(1), url).href);
  }

  private toggleMenu = () => {
    this.menu.open = !this.menu.open;
  };

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
      <md-outlined-button id="anchor" @click="${this.toggleMenu}">
        <hoverboard-icon slot="icon" name="calendar"></hoverboard-icon>
        ${msg('Add to calendar', { id: 'shared.add-to-calendar.label' })}
      </md-outlined-button>
      ${this.menuReady ? this.renderMenu(event) : nothing}
    `;
  }

  private renderMenu(event: CalendarEvent) {
    return html`
      <md-menu anchor="anchor">
        <md-menu-item href="${googleCalendarUrl(event)}" target="_blank">
          <div slot="headline">
            ${msg('Google Calendar', { id: 'shared.add-to-calendar.google' })}
          </div>
        </md-menu-item>
        <md-menu-item @click="${this.download}">
          <div slot="headline">
            ${msg('Apple Calendar', {
              id: 'shared.add-to-calendar.apple',
              desc: 'Downloads an .ics file for Apple Calendar and other calendar apps.',
            })}
          </div>
        </md-menu-item>
      </md-menu>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'add-to-calendar': AddToCalendar;
  }
}
