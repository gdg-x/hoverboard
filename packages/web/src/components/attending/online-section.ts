import { msg, str } from '@lit/localize';
import { css, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { attendance, attendingPage, stream, timeZone } from '../../config/site';
import { fromStore } from '../../controllers/from-store';
import { loadLocalTime, selectLocalTime } from '../../store/ui';
import { renderMarkdown } from '../../utils/markdown';
import '../shared/hoverboard-icon';
import { ThemedComponent } from '../themed-component';
import '../ui/hb-button';

/**
 * How to join an online or hybrid event: the link to watch it, the organizers' text, and which time
 * zone the site's times are in. The page puts its heading in the `heading` slot. In person, or
 * without a stream or text, it renders nothing.
 */
@customElement('online-section')
export class OnlineSection extends ThemedComponent {
  static override styles = css`
    :host {
      display: block;
    }

    .watch {
      margin-block-start: var(--hb-space-5);
    }

    .text {
      max-inline-size: var(--hb-prose-max);
      margin-block-start: var(--hb-space-4);
    }

    .text > :first-child {
      margin-block-start: 0;
    }

    .text > :last-child {
      margin-block-end: 0;
    }

    .time-zone {
      max-inline-size: var(--hb-prose-max);
      margin: var(--hb-space-4) 0 0;
    }
  `;

  /** How people attend, from site.json unless the page passes the one it rendered on the server. */
  @property({ attribute: false })
  accessor attendance: typeof attendance = attendance;

  @fromStore(selectLocalTime)
  private accessor localTime!: boolean;

  // The time zone line depends on the visitor's choice, which only the browser knows.
  @state()
  private accessor hydrated = false;

  override firstUpdated() {
    loadLocalTime();
    this.hydrated = true;
  }

  override render() {
    const text = attendingPage?.online;
    if (this.attendance === 'inPerson' || !(stream || text)) return nothing;
    return html`
      <slot name="heading"></slot>
      ${
        stream
          ? html`<hb-button class="watch" href="${stream}" target="_blank">
              <hoverboard-icon slot="icon" name="play"></hoverboard-icon>
              ${msg('Watch live', { id: 'pages.session.watch-live' })}
            </hb-button>`
          : nothing
      }
      ${text ? html`<div class="text">${unsafeHTML(renderMarkdown(text))}</div>` : nothing}
      ${
        this.hydrated
          ? html`<p class="time-zone">
              ${
                this.localTime
                  ? msg('Times on this site are in your time zone.', {
                      id: 'attending.online.your-time',
                    })
                  : msg(str`Times on this site are in ${timeZone.replaceAll('_', ' ')}.`, {
                      id: 'attending.online.event-time',
                    })
              }
            </p>`
          : nothing
      }
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'online-section': OnlineSection;
  }
}
