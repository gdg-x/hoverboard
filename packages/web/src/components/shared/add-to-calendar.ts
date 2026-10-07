import '@material/web/button/outlined-button.js';
import '@material/web/menu/menu.js';
import '@material/web/menu/menu-item.js';
import type { MdMenu } from '@material/web/menu/menu.js';
import { css, html, nothing } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import type { Session } from '../../models/session';
import { downloadIcs, googleCalendarUrl, sessionToCalendarEvent } from '../../utils/calendar';
import { sessionDetails } from '../../utils/data';
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

  private get event() {
    return this.session ? sessionToCalendarEvent(this.session, window.location.href) : undefined;
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
        ${sessionDetails.addToCalendar}
      </md-outlined-button>
      <md-menu anchor="anchor">
        <md-menu-item href="${googleCalendarUrl(event)}" target="_blank">
          <div slot="headline">${sessionDetails.googleCalendar}</div>
        </md-menu-item>
        <md-menu-item @click="${this.download}">
          <div slot="headline">${sessionDetails.appleCalendar}</div>
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
