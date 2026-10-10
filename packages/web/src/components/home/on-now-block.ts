import { Success } from '@abraham/remotedata';
import { msg, str } from '@lit/localize';
import { css, html, nothing, type PropertyValues } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { timeZone } from '../../config/site';
import { fromStore } from '../../controllers/from-store';
import type { BuiltSession } from '../../schedule/build-schedule';
import { type SessionsState, selectSessionsState } from '../../store/schedule';
import { loadLocalTime, selectLocalTime } from '../../store/ui';
import { band } from '../../styles/band';
import { currentTime } from '../../utils/clock';
import { sessionPath } from '../../utils/navigation';
import { isLive, sessionStream } from '../../utils/stream';
import { zonedTime } from '../../utils/time-zone';
import { otherTimeZone, visitorClock, yourTime } from '../../utils/visitor-time';
import '../shared/hoverboard-icon';
import { ThemedComponent } from '../themed-component';
import '../ui/hb-button';

/** How far ahead "Up next" looks. */
export const NEXT_WINDOW_MS = 30 * 60 * 1000;
const ONE_MINUTE_MS = 60 * 1000;

const start = ({ day, startTime }: BuiltSession) => zonedTime(day!, startTime!, timeZone).getTime();
const end = ({ day, endTime }: BuiltSession) => zonedTime(day!, endTime!, timeZone).getTime();

/** The sessions on at `now`, and the ones that start in the next 30 minutes, by start time. */
export const sessionsAround = (sessions: BuiltSession[], now: number) => {
  const timed = sessions
    .filter(({ day, startTime, endTime }) => day && startTime && endTime)
    .sort((a, b) => start(a) - start(b));
  return {
    on: timed.filter((session) => start(session) <= now && now < end(session)),
    next: timed.filter((session) => now < start(session) && start(session) <= now + NEXT_WINDOW_MS),
  };
};

/**
 * During the event, the sessions on now and the ones up next, with their links to watch live.
 * The home page adds it in the browser on the event's days. It hides itself when nothing is on.
 */
@customElement('on-now-block')
export class OnNowBlock extends ThemedComponent {
  static override styles = [
    band,
    css`
      :host([hidden]) {
        display: none;
      }

      .band-title {
        margin-block-end: var(--hb-space-6);
      }

      h3 {
        margin: var(--hb-space-7) 0 var(--hb-space-4);
        font: 700 var(--hb-text-xl) / 1.2 var(--hb-font-display);
      }

      .sessions {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(min(18rem, 100%), 1fr));
        gap: var(--hb-space-4);
      }

      .session {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: var(--hb-space-2);
        padding: var(--hb-space-4);
        border: var(--hb-border-width) solid var(--hb-border-color);
        border-radius: var(--hb-radius-m);
        background-color: var(--hb-panel-background);
        color: var(--hb-color-on-surface);
        box-shadow: var(--hb-shadow-card);
      }

      .title {
        margin: 0;
        font: 700 var(--hb-text-lg) / 1.3 var(--hb-font-body);
        overflow-wrap: anywhere;
      }

      .title a {
        color: inherit;
      }

      .meta,
      .speakers {
        margin: 0;
        color: var(--hb-color-on-surface-variant);
        font-size: var(--hb-text-sm);
      }

      .meta {
        font-family: var(--hb-font-mono);
      }
    `,
  ];

  @fromStore(selectSessionsState)
  private accessor sessions!: SessionsState;
  @fromStore(selectLocalTime)
  private accessor localTime!: boolean;

  // The block is only in the browser, so it can read the time from the start.
  @state()
  private accessor now = currentTime();
  private clock: ReturnType<typeof setInterval> | undefined;

  override connectedCallback() {
    super.connectedCallback();
    loadLocalTime();
    this.now = currentTime();
    this.clock = setInterval(() => (this.now = currentTime()), ONE_MINUTE_MS);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    clearInterval(this.clock);
  }

  private get around() {
    return this.sessions instanceof Success
      ? sessionsAround(this.sessions.data, this.now)
      : { on: [], next: [] };
  }

  override updated(changed: PropertyValues) {
    super.updated(changed);
    const { on, next } = this.around;
    this.hidden = !on.length && !next.length;
  }

  override render() {
    const { on, next } = this.around;
    if (!on.length && !next.length) return nothing;
    return html`
      <section class="inner" aria-labelledby="on-now-title">
        <h2 class="band-title" id="on-now-title">${msg('On now', { id: 'home.on-now.title' })}</h2>
        ${
          on.length
            ? html`<ul class="sessions plain">
                ${on.map((session) =>
                  this.renderSession(
                    session,
                    msg(str`Until ${this.time(session, session.endTime!)}`, {
                      id: 'home.on-now.until',
                    }),
                  ),
                )}
              </ul>`
            : nothing
        }
        ${
          next.length
            ? html`<h3>${msg('Up next', { id: 'home.on-now.next' })}</h3>
                <ul class="sessions plain">
                  ${next.map((session) =>
                    this.renderSession(session, this.time(session, session.startTime!)),
                  )}
                </ul>`
            : nothing
        }
      </section>
    `;
  }

  /** A time of the session, in the visitor's time zone when they chose so. */
  private time(session: BuiltSession, time: string) {
    return this.localTime && otherTimeZone()
      ? yourTime(visitorClock(session.day!, time).time)
      : time;
  }

  private renderSession(session: BuiltSession, time: string) {
    const meta = [time, session.track?.title].filter(Boolean).join(' · ');
    const speakers = session.speakers
      .map(({ name }) => name)
      .filter(Boolean)
      .join(', ');
    const stream = isLive(session, this.now) ? sessionStream(session) : undefined;
    return html`
      <li class="session">
        <p class="meta">${meta}</p>
        <p class="title"><a href="${sessionPath(session.id)}">${session.title}</a></p>
        ${speakers ? html`<p class="speakers">${speakers}</p>` : nothing}
        ${
          stream
            ? html`<hb-button class="live-button" href="${stream}" target="_blank">
                <hoverboard-icon slot="icon" name="play"></hoverboard-icon>
                ${msg('Watch live', { id: 'pages.session.watch-live' })}
              </hb-button>`
            : nothing
        }
      </li>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'on-now-block': OnNowBlock;
  }
}
