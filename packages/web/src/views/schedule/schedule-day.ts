import { Success } from '@abraham/remotedata';
import { msg, str } from '@lit/localize';
import { css, html, nothing, type PropertyValues } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';
import type { Filter } from '../../models/filter';
import { FilterGroupKey } from '../../models/filter-group';
import type {
  BuiltDay,
  BuiltSession,
  BuiltTimeslot,
  ScheduleTrack,
  SessionBlock,
} from '../../schedule/build-schedule';
import type { RouteLocation } from '../../utils/navigation';
import { selectFilters } from '../../store/filters';
import { type ScheduleState, selectScheduleState } from '../../store/schedule';
import { selectLocalTime } from '../../store/ui';
import { timeZone } from '../../config/site';
import { clearFilters } from '../../utils/filters';
import { getScheduleDay } from '../../utils/dates';
import { getLocale } from '../../utils/localization';
import { generateClassName } from '../../utils/styles';
import { wallClock, zonedTime } from '../../utils/time-zone';
import '../../components/shared/hoverboard-icon';
import '../../components/schedule/session-element';
import '../../components/ui/hb-button';
import '../../components/ui/hb-icon-button';
import { fromStore } from '../../controllers/from-store';
import { ThemedElement } from '../../components/themed-element';
import { illustration, illustrationStyles } from '../../illustrations/illustration';
import noResults from '../../illustrations/no-results.svg?raw';

const ONE_MINUTE_MS = 60_000;

/** Moves a generated `grid-area` one column over, to make room for the time column. */
export const withTimeColumn = (gridArea: string | undefined): string | undefined => {
  const parts = gridArea?.split('/').map((part) => Number(part.trim()));
  if (parts?.length !== 4 || parts.some(Number.isNaN)) return undefined;
  const [rowStart, columnStart, rowEnd, columnEnd] = parts as [number, number, number, number];
  return `${rowStart} / ${columnStart + 1} / ${rowEnd} / ${columnEnd + 1}`;
};

const minutes = (time: string) => {
  const [hours = 0, mins = 0] = time.split(':').map(Number);
  return hours * 60 + mins;
};

// Track filters pick columns, in `trackColumns`, rather than sessions.
export const matchesFilters = (session: BuiltSession, filters: Filter[]) =>
  filters.every((filter) => {
    if (filter.group === FilterGroupKey.track) return true;
    const values = session[filter.group];
    if (values === undefined) return false;
    const tags = typeof values === 'string' ? [values] : values;
    return tags.some((value) => generateClassName(value) === generateClassName(filter.tag));
  });

/** The columns of the tracks the filters pick, or every column without a track filter. */
export const trackColumns = (tracks: ScheduleTrack[], filters: Filter[]): number[] => {
  if (tracks.length === 0) return [1];
  const columns = tracks.map((_, index) => index + 1);
  const picked = filters
    .filter((filter) => filter.group === FilterGroupKey.track)
    .map((filter) => filter.tag);
  if (picked.length === 0) return columns;
  return columns.filter((column) => picked.includes(generateClassName(tracks[column - 1]!.id)));
};

/**
 * Fits a block's `grid-area` to the columns shown, or nothing when it is in none of them. A session
 * that spans every track spans the ones shown.
 */
export const narrowGridArea = (gridArea: string, columns: number[]): string | undefined => {
  const [rowStart, columnStart = 1, rowEnd, columnEnd = 2] = gridArea
    .split('/')
    .map((part) => Number(part.trim()));
  const shown = columns.filter((column) => column >= columnStart && column < columnEnd);
  if (shown.length === 0) return undefined;
  const start = columns.indexOf(shown[0]!) + 1;
  return `${rowStart} / ${start} / ${rowEnd} / ${start + shown.length}`;
};

/**
 * One day of the schedule. On wide containers, tracks are columns that scroll sideways when they do
 * not fit, with the times fixed at the start and the track names fixed at the top. On narrow ones,
 * sessions are one list in time order. During the day, a line marks the current time.
 */
@customElement('schedule-day')
export class ScheduleDay extends ThemedElement {
  static override styles = [
    illustrationStyles,
    css`
      :host {
        display: block;
        container-type: inline-size;
      }

      [hidden] {
        display: none !important;
      }

      .pager {
        display: flex;
        align-items: center;
        gap: var(--hb-space-1);
        margin-block-end: var(--hb-space-2);
        color: var(--hb-color-on-surface-variant);
        font-size: var(--hb-text-sm);
      }

      .pager-text {
        margin-inline-end: auto;
      }

      .grid,
      .header-grid {
        display: grid;
        grid-template-columns: 4.5rem repeat(var(--tracks, 1), minmax(16rem, 1fr));
        gap: var(--hb-space-3);
        min-inline-size: min-content;
      }

      .header {
        position: sticky;
        z-index: 3;
        inset-block-start: var(--hb-schedule-sticky-top, 0px);
        overflow: hidden;
        background-color: var(--hb-bar-background);
        backdrop-filter: var(--hb-backdrop-filter);
      }

      .header-grid {
        padding-block: var(--hb-space-2);
        padding-inline-end: var(--hb-space-2);
        border-block-end: var(--hb-border-width) solid var(--hb-border-color);
      }

      .corner {
        position: sticky;
        z-index: 1;
        inset-inline-start: 0;
        background-color: var(--hb-bar-background);
      }

      .track {
        padding-inline: var(--hb-space-3);
        font-weight: 700;
        overflow-wrap: anywhere;
      }

      .scroller {
        overflow-x: auto;
        scroll-snap-type: x proximity;
        scroll-padding-inline-start: calc(4.5rem + var(--hb-space-3));
        border-radius: var(--hb-radius-m);
      }

      .scroller:focus-visible {
        outline: 3px solid var(--hb-color-focus);
        outline-offset: 2px;
      }

      .grid {
        position: relative;
        padding-block: var(--hb-space-4);
        padding-inline-end: var(--hb-space-2);
      }

      .time {
        position: sticky;
        z-index: 2;
        inset-inline-start: 0;
        grid-column: 1;
        padding-block-start: var(--hb-space-3);
        background-color: var(--hb-bar-background);
        backdrop-filter: var(--hb-backdrop-filter);
        font: 600 var(--hb-text-md) / 1.2 var(--hb-font-mono);
        scroll-margin-block-start: calc(var(--hb-schedule-sticky-top, 0px) + 4rem);
      }

      .block {
        display: flex;
        flex-direction: column;
        gap: var(--hb-space-3);
        min-inline-size: 0;
        scroll-snap-align: start;
      }

      .block session-element {
        flex: 1;
      }

      .browse {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: var(--hb-space-2);
        grid-column: 2 / -1;
        min-block-size: 4rem;
        border: var(--hb-border-width) dashed var(--hb-color-outline-variant);
        border-radius: var(--hb-radius-m);
        color: var(--hb-color-on-surface-variant);
        text-decoration: none;
      }

      .browse:hover {
        border-color: var(--hb-color-outline);
        color: var(--hb-color-on-surface);
      }

      .browse:focus-visible {
        outline: 3px solid var(--hb-color-focus);
        outline-offset: 2px;
      }

      .browse hoverboard-icon {
        inline-size: 20px;
        block-size: 20px;
      }

      .now {
        position: relative;
        z-index: 4;
        grid-column: 1 / -1;
        pointer-events: none;
      }

      .now-line {
        position: absolute;
        inset-inline: 0;
        display: flex;
        align-items: center;
        gap: var(--hb-space-2);
        color: var(--hb-color-error);
        font: 700 var(--hb-text-sm) / 1 var(--hb-font-mono);
        translate: 0 -50%;
      }

      .now-line::after {
        content: '';
        flex: 1;
        block-size: 2px;
        background-color: currentColor;
      }

      /* The label stays in view when the grid scrolls sideways. */
      .now-label {
        position: sticky;
        inset-inline-start: 0;
        padding: var(--hb-space-1) var(--hb-space-2);
        border-radius: var(--hb-radius-full);
        background-color: var(--hb-bar-background);
        backdrop-filter: var(--hb-backdrop-filter);
      }

      .empty {
        display: grid;
        justify-items: start;
        gap: var(--hb-space-3);
        padding-block: var(--hb-space-6);
      }

      .empty p {
        margin: 0;
      }

      .empty .illustration {
        inline-size: min(100%, 12rem);
      }

      @container (width < 640px) {
        .pager,
        .header {
          display: none;
        }

        .scroller {
          overflow: visible;
        }

        .grid {
          display: flex;
          flex-direction: column;
          min-inline-size: 0;
          padding-inline-end: 0;
        }

        .time {
          position: static;
          padding-block-start: var(--hb-space-4);
        }

        .now {
          block-size: 1.5rem;
        }

        .now-line {
          inset-block-start: 50% !important;
        }
      }

      @media (forced-colors: active) {
        .now-line {
          color: Highlight;
        }
      }
    `,
  ];

  @fromStore((state) => selectScheduleState(state))
  accessor schedule!: ScheduleState;
  @property({ attribute: false })
  accessor location: RouteLocation | undefined;
  @property({ attribute: false })
  accessor day: BuiltDay | undefined;
  @property({ type: Boolean })
  accessor onlyFeatured = false;
  @fromStore((state) => selectFilters(state))
  private accessor selectedFilters!: Filter[];
  @fromStore((state) => selectLocalTime(state))
  private accessor localTime!: boolean;

  // The current time, set only in the browser so the first render matches the server's.
  @state()
  private accessor now: Date | undefined;
  @state()
  private accessor overflowing = false;
  @state()
  private accessor atStart = true;
  @state()
  private accessor atEnd = false;

  @query('.scroller')
  private accessor scroller!: HTMLElement | null;
  @query('.header')
  private accessor header!: HTMLElement | null;

  private clock: ReturnType<typeof setInterval> | undefined;
  private resizeObserver: ResizeObserver | undefined;
  private scrolledToNow = false;

  override willUpdate(changed: PropertyValues<this>) {
    if (changed.has('location') || changed.has('schedule') || changed.has('onlyFeatured')) {
      this.updateDay();
    }
  }

  override firstUpdated() {
    this.now = new Date();
    this.clock = setInterval(() => (this.now = new Date()), ONE_MINUTE_MS);
    this.updateOverflow();
    if (typeof ResizeObserver !== 'undefined' && this.scroller) {
      this.resizeObserver = new ResizeObserver(() => this.updateOverflow());
      this.resizeObserver.observe(this.scroller);
    }
    this.scrollToHash();
  }

  override updated() {
    if (!this.scrolledToNow && !this.onlyFeatured && !window.location.hash) {
      const line = this.renderRoot.querySelector('.now');
      if (line) {
        this.scrolledToNow = true;
        line.scrollIntoView({ block: 'center' });
      }
    }
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    clearInterval(this.clock);
    this.resizeObserver?.disconnect();
  }

  override render() {
    const day = this.day;
    if (!day) return nothing;
    const columns = trackColumns(day.tracks, this.selectedFilters);
    const shownTracks = day.tracks.filter((_, index) => columns.includes(index + 1));
    const tracks = columns.length;
    const filtered = this.selectedFilters.length > 0;
    const visible = day.timeslots.map((timeslot) => this.visibleBlocks(timeslot, columns));
    const now = this.nowPosition(day);

    if (filtered && !this.onlyFeatured && visible.every((blocks) => blocks.length === 0)) {
      return html`
        <div class="empty">
          ${illustration(noResults)}
          <p>${msg('No sessions match these filters.', { id: 'schedule.day.no-results' })}</p>
          <hb-button variant="tonal" @click="${clearFilters}">
            ${msg('Clear filters', { id: 'schedule.day.clear-filters' })}
          </hb-button>
        </div>
      `;
    }

    return html`
      <div class="pager" ?hidden="${!this.overflowing}">
        <span class="pager-text">
          ${msg(str`${tracks} tracks. Scroll sideways to see them all.`, {
            id: 'schedule.day.scroll-hint',
          })}
        </span>
        <hb-icon-button
          label="${msg('Previous track', { id: 'schedule.day.previous-track' })}"
          ?disabled="${this.atStart}"
          @click="${() => this.scrollByTrack(-1)}"
        >
          <hoverboard-icon name="chevron-left"></hoverboard-icon>
        </hb-icon-button>
        <hb-icon-button
          label="${msg('Next track', { id: 'schedule.day.next-track' })}"
          ?disabled="${this.atEnd}"
          @click="${() => this.scrollByTrack(1)}"
        >
          <hoverboard-icon name="chevron-right"></hoverboard-icon>
        </hb-icon-button>
      </div>

      <div class="header" aria-hidden="true">
        <div class="header-grid" style="${styleMap({ '--tracks': String(tracks) })}">
          <div class="corner"></div>
          ${shownTracks.map((track) => html`<div class="track">${track.title}</div>`)}
        </div>
      </div>

      <div
        class="scroller"
        role="region"
        aria-label="${msg(str`Schedule for ${getScheduleDay(day.date)}`, {
          id: 'schedule.day.label',
        })}"
        tabindex="${ifDefined(this.overflowing ? 0 : undefined)}"
        @scroll="${this.onScroll}"
      >
        <div class="grid" style="${styleMap({ '--tracks': String(tracks) })}">
          ${repeat(
            day.timeslots,
            (timeslot) => timeslot.startTime,
            (timeslot, index) => html`
              ${
                // A row where no session starts, such as a break, has no time.
                timeslot.sessions.length
                  ? html`<div
                      class="time"
                      id="${timeslot.startTime}"
                      style="grid-row: ${index + 1}"
                    >
                      ${this.renderTime(day.date, timeslot.startTime)}
                    </div>`
                  : nothing
              }
              ${
                now?.index === index
                  ? html`<div class="now" style="grid-row: ${index + 1}">
                      <div class="now-line" style="inset-block-start: ${now.offset}%">
                        <span class="now-label">
                          ${msg(str`Now · ${now.label}`, { id: 'schedule.day.now' })}
                        </span>
                      </div>
                    </div>`
                  : nothing
              }
              ${
                this.onlyFeatured && timeslot.sessions.length && visible[index]!.length === 0
                  ? html`<a
                      class="browse"
                      href="/schedule/${day.date}#${timeslot.startTime}"
                      style="grid-row: ${index + 1}"
                    >
                      <hoverboard-icon name="add-circle-outline"></hoverboard-icon>
                      ${msg('Browse sessions', { id: 'schedule.day.browse-sessions' })}
                    </a>`
                  : nothing
              }
              ${visible[index]!.map(
                ({ gridArea, sessions }) => html`
                  <div class="block" style="${styleMap({ 'grid-area': withTimeColumn(gridArea) })}">
                    ${repeat(
                      sessions,
                      (session) => session.id,
                      (session) => html`<session-element .session="${session}"></session-element>`,
                    )}
                  </div>
                `,
              )}
            `,
          )}
        </div>
      </div>
    `;
  }

  /** The time in the event time zone, or the visitor's when they chose so. */
  private renderTime(date: string, startTime: string) {
    const instant = zonedTime(date, startTime, timeZone);
    if (!this.localTime) {
      return html`<time datetime="${instant.toISOString()}">${startTime}</time>`;
    }
    const local = wallClock(instant);
    const weekday =
      local.date === date
        ? ''
        : ` ${new Intl.DateTimeFormat(getLocale(), { weekday: 'short', timeZone: 'UTC' }).format(
            new Date(`${local.date}T00:00:00Z`),
          )}`;
    return html`<time datetime="${instant.toISOString()}">${local.time}${weekday}</time>`;
  }

  private visibleBlocks(
    timeslot: BuiltTimeslot,
    columns: number[],
  ): { gridArea: string; sessions: BuiltSession[] }[] {
    return timeslot.sessions.flatMap((block: SessionBlock) => {
      const gridArea = narrowGridArea(block.gridArea, columns);
      const sessions = block.items.filter((session) =>
        matchesFilters(session, this.selectedFilters),
      );
      return gridArea && sessions.length ? [{ gridArea, sessions }] : [];
    });
  }

  /** Which timeslot holds the current time, and how far into it, during this day. */
  private nowPosition(day: BuiltDay) {
    if (!this.now) return undefined;
    const event = wallClock(this.now, timeZone);
    if (event.date !== day.date) return undefined;
    const current = minutes(event.time);
    const index = day.timeslots.findIndex(
      ({ startTime, endTime }) => minutes(startTime) <= current && current < minutes(endTime),
    );
    if (index === -1) return undefined;
    const { startTime, endTime } = day.timeslots[index]!;
    const offset = ((current - minutes(startTime)) / (minutes(endTime) - minutes(startTime))) * 100;
    const label = this.localTime ? wallClock(this.now).time : event.time;
    return { index, offset: Math.round(offset), label };
  }

  private readonly onScroll = () => {
    if (this.header && this.scroller) this.header.scrollLeft = this.scroller.scrollLeft;
    this.updateOverflow();
  };

  private updateOverflow() {
    const scroller = this.scroller;
    if (!scroller) return;
    this.overflowing = scroller.scrollWidth > scroller.clientWidth + 1;
    this.atStart = scroller.scrollLeft <= 0;
    this.atEnd = scroller.scrollLeft + scroller.clientWidth >= scroller.scrollWidth - 1;
  }

  private scrollByTrack(direction: 1 | -1) {
    const track = this.renderRoot.querySelector('.track');
    const width = track?.getBoundingClientRect().width ?? 0;
    this.scroller?.scrollBy({ left: direction * width, behavior: 'smooth' });
  }

  // Ids in shadow roots are not fragment targets, so links such as `#10:00` scroll here.
  private scrollToHash() {
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (!id) return;
    const target = [...this.renderRoot.querySelectorAll('.time')].find((time) => time.id === id);
    target?.scrollIntoView({ block: 'start' });
  }

  private updateDay() {
    if (this.onlyFeatured || !this.location || !(this.schedule instanceof Success)) return;
    const { params, pathname } = this.location;
    if (pathname.endsWith('my-schedule')) return;
    const date = (params['id'] as string | undefined) || this.schedule.data[0]?.date;
    this.day = this.schedule.data.find((day) => day.date === date);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'schedule-day': ScheduleDay;
  }
}
