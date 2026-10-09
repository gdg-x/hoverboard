import { Success } from '@abraham/remotedata';
import { msg, str } from '@lit/localize';
import { css, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { RouteLocation } from '../../utils/navigation';
import { type ScheduleState, selectScheduleState } from '../../store/schedule';
import { navigationLabel } from '../shell/navigation-label';
import { fromStore } from '../../controllers/from-store';
import { ThemedElement } from '../themed-element';

/** The schedule's days and My schedule as one row of links, so each day keeps its own URL. */
@customElement('schedule-tabs')
export class ScheduleTabs extends ThemedElement {
  static override styles = css`
    :host {
      display: block;
    }

    ul {
      display: flex;
      gap: var(--hb-space-2);
      margin: 0;
      padding: var(--hb-space-1) 2px var(--hb-space-1) 0;
      overflow-x: auto;
      list-style: none;
      scrollbar-width: none;
    }

    li {
      flex: none;
    }

    a {
      display: inline-flex;
      align-items: center;
      gap: var(--hb-space-2);
      min-block-size: var(--hb-target-min);
      padding-inline: var(--hb-space-4);
      border: var(--hb-border-width) solid var(--hb-border-color);
      border-radius: var(--hb-radius-full);
      background-color: var(--hb-panel-background);
      backdrop-filter: var(--hb-backdrop-filter);
      color: var(--hb-color-on-surface);
      font-weight: 600;
      text-decoration: none;
      white-space: nowrap;
    }

    a:hover {
      background-color: color-mix(
        in srgb,
        var(--hb-color-on-surface) 8%,
        var(--hb-color-surface-bright)
      );
    }

    a:focus-visible {
      outline: 3px solid var(--hb-color-focus);
      outline-offset: 2px;
    }

    a[aria-current='page'] {
      border-color: var(--hb-color-primary);
      background-color: var(--hb-color-primary);
      color: var(--hb-color-on-primary);
    }

    .date {
      font-weight: 400;
    }

    @media (forced-colors: active) {
      a[aria-current='page'] {
        border-color: Highlight;
        background-color: Highlight;
        color: HighlightText;
      }
    }
  `;

  @fromStore((state) => selectScheduleState(state))
  accessor schedule!: ScheduleState;
  @property({ attribute: false })
  accessor location: RouteLocation | undefined;

  // On narrow screens the tabs scroll sideways, so bring the current one into view.
  override firstUpdated() {
    const list = this.renderRoot.querySelector('ul');
    const current = list?.querySelector<HTMLElement>('[aria-current="page"]');
    if (list && current) {
      list.scrollLeft = current.offsetLeft - (list.clientWidth - current.offsetWidth) / 2;
    }
  }

  override render() {
    const days = this.schedule instanceof Success ? this.schedule.data : [];
    const selected = this.selected;
    return html`
      <nav aria-label="${msg('Schedule days', { id: 'schedule.tabs.label' })}">
        <ul>
          ${days.map(
            (day, index) => html`
              <li>
                <a
                  href="${this.href(day.date)}"
                  aria-current="${day.date === selected ? 'page' : 'false'}"
                  data-day="${day.date}"
                >
                  ${
                    days.length > 1
                      ? html`<span>${msg(str`Day ${index + 1}`, { id: 'schedule.tabs.day' })}</span>
                          <span class="date">${day.dateReadable}</span>`
                      : day.dateReadable
                  }
                </a>
              </li>
            `,
          )}
          ${
            __HB_FEATURES__.mySchedule
              ? html`<li>
                  <a
                    href="${this.href('my-schedule')}"
                    aria-current="${selected === 'my-schedule' ? 'page' : 'false'}"
                    data-day="my-schedule"
                    >${navigationLabel('mySchedule')}</a
                  >
                </li>`
              : nothing
          }
        </ul>
      </nav>
    `;
  }

  private get selected() {
    if (!this.location || !(this.schedule instanceof Success)) return undefined;
    const { params, pathname } = this.location;
    if (pathname.endsWith('my-schedule')) return 'my-schedule';
    return (params['id'] as string | undefined) || this.schedule.data[0]?.date;
  }

  private href(id: string) {
    return `/schedule/${id}${this.location?.search ?? ''}`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'schedule-tabs': ScheduleTabs;
  }
}
