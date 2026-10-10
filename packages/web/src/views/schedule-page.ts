import { Pending } from '@abraham/remotedata';
import { msg, str } from '@lit/localize';
import { css, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import '../components/hero/simple-hero';
import '../components/schedule/schedule-tabs';
import '../components/shared/filter-menu';
import '../components/ui/hb-progress';
import '../components/ui/hb-switch';
import type { HbSwitch } from '../components/ui/hb-switch';
import type { Filter } from '../models/filter';
import type { FilterGroup } from '../models/filter-group';
import type { RouteLocation } from '../utils/navigation';
import { selectFilters } from '../store/filters';
import { type ScheduleState, selectScheduleState } from '../store/schedule';
import { selectFilterGroups } from '../store/sessions/selectors';
import { loadLocalTime, selectLocalTime, setLocalTime } from '../store/ui';
import { timeZone } from '../config/site';
import { PageMetadataController } from '../controllers/page-metadata-controller';
import { fromStore } from '../controllers/from-store';
import { ThemedComponent } from '../components/themed-component';

/** IANA names such as `America/New_York`, as people read them. */
const zoneName = (zone: string) => zone.replaceAll('_', ' ');

/**
 * The schedule's frame: the hero, the day tabs that stay under the header, the time zone switch and
 * the filters. The day or My schedule is the slotted content.
 */
@customElement('schedule-page')
export class SchedulePage extends ThemedComponent {
  static override styles = css`
    :host {
      --hb-schedule-tabs-height: calc(var(--hb-target-min) + 4px + 2 * var(--hb-space-3));
      --hb-schedule-sticky-top: calc(var(--hb-header-height) + var(--hb-schedule-tabs-height));

      display: block;
      background-color: var(--hb-section-background);
      color: var(--hb-color-on-surface);
    }

    /* Content-box, so the text column lines up with the hero's. */
    .inner {
      box-sizing: content-box;
      max-inline-size: var(--hb-content-max);
      margin-inline: auto;
      padding-inline: var(--hb-gutter);
    }

    .tabs {
      position: sticky;
      z-index: 5;
      inset-block-start: var(--hb-header-height);
      display: flex;
      align-items: center;
      box-sizing: border-box;
      block-size: var(--hb-schedule-tabs-height);
      border-block-end: 1px solid var(--hb-color-outline-variant);
      background-color: var(--hb-bar-background);
      backdrop-filter: var(--hb-backdrop-filter);
    }

    .tabs schedule-tabs {
      flex: 1;
      min-inline-size: 0;
    }

    .tabs .inner {
      flex: 1;
      min-inline-size: 0;
    }

    .toolbar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--hb-space-3) var(--hb-space-5);
      padding-block: var(--hb-space-5) var(--hb-space-3);
    }

    .zone {
      margin: 0;
      color: var(--hb-color-on-surface-variant);
      font-size: var(--hb-text-sm);
    }

    .zone strong {
      color: var(--hb-color-on-surface);
      font-family: var(--hb-font-mono);
      font-weight: 600;
    }

    filter-menu {
      flex-basis: 100%;
    }

    .content {
      padding-block-end: var(--hb-space-9);
    }
  `;

  private readonly metadata = new PageMetadataController(this, 'schedule');

  @fromStore((state) => selectScheduleState(state))
  accessor schedule!: ScheduleState;
  @fromStore((state) => selectFilterGroups(state))
  private accessor filterGroups!: FilterGroup[];
  @fromStore((state) => selectFilters(state))
  private accessor selectedFilters!: Filter[];
  @fromStore((state) => selectLocalTime(state))
  private accessor localTime!: boolean;
  @property({ attribute: false })
  accessor location: RouteLocation | undefined;

  // The visitor's time zone, known only in the browser. The switch shows when it differs.
  @state()
  private accessor visitorTimeZone: string | undefined;

  override firstUpdated() {
    this.visitorTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    loadLocalTime();
  }

  override render() {
    const mySchedule = this.location?.pathname.endsWith('my-schedule') ?? false;
    const visitorZone = this.visitorTimeZone;
    const otherZone = !!visitorZone && visitorZone !== timeZone;
    const shownZone = this.localTime && otherZone ? visitorZone : timeZone;

    return html`
      <simple-hero page="schedule"></simple-hero>

      <div class="tabs">
        <div class="inner"><schedule-tabs .location="${this.location}"></schedule-tabs></div>
      </div>

      <div class="inner">
        <div class="toolbar">
          <p class="zone">
            ${msg(html`Times in <strong>${zoneName(shownZone)}</strong>`, {
              id: 'schedule.page.time-zone',
            })}
          </p>
          ${
            otherZone
              ? html`<hb-switch .checked="${this.localTime}" @change="${this.onLocalTimeChange}">
                  ${msg(str`Show my time zone, ${zoneName(visitorZone)}`, {
                    id: 'schedule.page.local-time',
                  })}
                </hb-switch>`
              : nothing
          }
          ${
            mySchedule
              ? nothing
              : html`<filter-menu
                  .filterGroups="${this.filterGroups}"
                  .selectedFilters="${this.selectedFilters}"
                ></filter-menu>`
          }
        </div>

        <hb-progress ?hidden="${!(this.schedule instanceof Pending)}"></hb-progress>

        <div class="content"><slot></slot></div>
      </div>
    `;
  }

  private readonly onLocalTimeChange = (event: Event) => {
    setLocalTime((event.target as HbSwitch).checked);
  };
}

declare global {
  interface HTMLElementTagNameMap {
    'schedule-page': SchedulePage;
  }
}
