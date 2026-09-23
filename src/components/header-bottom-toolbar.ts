import { Initialized, Pending, Success } from '@abraham/remotedata';
import { RouterLocation } from '@vaadin/router';
import { css, html, PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { RootState } from '../store';
import { ReduxMixin } from '../store/mixin';
import { ScheduleState, selectScheduleState } from '../store/schedule';
import { contentLoaders, mySchedule } from '../utils/data';
import { updateSelectionBar } from '../utils/tab-selection-bar';
import './content-loader';
import { ThemedElement } from './themed-element';

@customElement('header-bottom-toolbar')
export class HeaderBottomToolbar extends ReduxMixin(ThemedElement) {
  static override get styles() {
    return [
      ...super.styles,
      css`
        :host {
          display: block;
          background-color: var(--primary-background-color);
        }

        .toolbar {
          margin: 0 auto;
          padding: 0 16px;
          height: auto;
          max-width: var(--max-container-width);
        }

        .nav-items {
          position: relative;
          width: 100%;
          height: 64px;
          display: flex;
          align-items: stretch;
          overflow-x: auto;
          scrollbar-width: none;
        }

        .nav-items::-webkit-scrollbar {
          display: none;
        }

        .selection-bar {
          position: absolute;
          left: 0;
          bottom: 0;
          height: 2px;
          width: 0;
          background-color: var(--default-primary-color);
          transition:
            left 0.2s ease,
            width 0.2s ease;
          pointer-events: none;
        }

        .nav-item {
          display: flex;
          align-items: center;
          flex: none;
        }

        .nav-item a {
          padding: 0 14px;
          color: var(--primary-text-color);
        }

        @media (min-width: 640px) {
          .toolbar {
            padding: 0 36px;
          }
        }
      `,
    ];
  }

  private mySchedule = mySchedule;
  private contentLoaders = contentLoaders.schedule;

  @property({ type: Object })
  schedule: ScheduleState = new Initialized();
  @property({ type: Object })
  location: RouterLocation | undefined;
  @state()
  private signedIn = false;

  override stateChanged(state: RootState) {
    this.schedule = selectScheduleState(state);
    this.signedIn = state.user instanceof Success;
  }

  override updated(changedProperties: PropertyValues) {
    super.updated(changedProperties);
    this.positionSelectionBar();
  }

  private positionSelectionBar() {
    const container = this.renderRoot.querySelector('nav.nav-items');
    const selected = container?.querySelector<HTMLElement>('.nav-item.selected');
    const bar = container?.querySelector<HTMLElement>('.selection-bar');
    updateSelectionBar(bar, selected);
  }

  override render() {
    return html`
      <div class="toolbar bottom-toolbar">
        <content-loader
          class="nav-items"
          card-padding="15px"
          card-width="105px"
          card-margin="0 14px 0 0"
          card-height="64px"
          avatar-size="0"
          avatar-circle="0"
          title-top-position="20px"
          title-height="24px"
          title-width="75%"
          load-from="-240%"
          load-to="350%"
          blur-width="80px"
          items-count="${this.contentLoaders.itemsCount}"
          layout
          horizontal
          ?hidden="${!this.pending}"
        >
        </content-loader>

        <nav class="nav-items" ?hidden="${this.pending}" role="navigation">
          <span class="selection-bar"></span>
          ${this.days.map(
            (day) => html`
              <div
                class="nav-item ${day.date === this.selectedTab ? 'selected' : ''}"
                data-day="${day.date}"
              >
                <a href="${this.addQueryParams(day.date, this.location?.search)}"
                  >${day.dateReadable}</a
                >
              </div>
            `,
          )}
          <div
            class="nav-item ${this.selectedTab === 'my-schedule' ? 'selected' : ''}"
            data-day="my-schedule"
            ?hidden="${!this.signedIn}"
          >
            <a href="${this.addQueryParams('my-schedule', this.location?.search)}"
              >${this.mySchedule.title}</a
            >
          </div>
        </nav>
      </div>
    `;
  }

  private get days() {
    return this.schedule instanceof Success ? this.schedule.data : [];
  }

  private get pending() {
    return this.schedule instanceof Pending;
  }

  private get selectedTab() {
    if (this.location && this.schedule instanceof Success) {
      const {
        params: { id },
        pathname,
      } = this.location;
      if (pathname.endsWith('my-schedule')) {
        return 'my-schedule';
      } else {
        return id || this.schedule.data[0]?.date;
      }
    } else {
      return undefined;
    }
  }

  private addQueryParams(id: string, queryParams?: string) {
    return `/schedule/${id}${queryParams || ''}`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'header-bottom-toolbar': HeaderBottomToolbar;
  }
}
