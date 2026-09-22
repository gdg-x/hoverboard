import { Initialized, Pending, Success } from '@abraham/remotedata';
import '@polymer/app-layout/app-toolbar/app-toolbar';
import '@polymer/paper-tabs';
import { RouterLocation } from '@vaadin/router';
import { css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { RootState, store } from '../store';
import { ReduxMixin } from '../store/mixin';
import { fetchSchedule } from '../store/schedule/actions';
import { initialScheduleState } from '../store/schedule/state';
import { contentLoaders, mySchedule } from '../utils/data';
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

        app-toolbar {
          margin: 0 auto;
          padding: 0 16px;
          height: auto;
          max-width: var(--max-container-width);
        }

        .nav-items {
          --paper-tabs-selection-bar-color: var(--default-primary-color);
          width: 100%;
        }

        paper-tabs.nav-items {
          height: 64px;
        }

        .nav-item a {
          padding: 0 14px;
          color: var(--primary-text-color);
        }

        @media (min-width: 640px) {
          app-toolbar {
            padding: 0 36px;
          }
        }
      `,
    ];
  }

  private mySchedule = mySchedule;
  private contentLoaders = contentLoaders.schedule;

  @property({ type: Object })
  schedule = initialScheduleState;
  @property({ type: Object })
  location: RouterLocation | undefined;
  @property({ type: Boolean })
  private signedIn = false;

  override stateChanged(state: RootState) {
    this.schedule = state.schedule;
    this.signedIn = state.user instanceof Success;
  }

  override connectedCallback() {
    super.connectedCallback();
    if (this.schedule instanceof Initialized) {
      store.dispatch(fetchSchedule);
    }
  }

  override render() {
    return html`
      <app-toolbar class="bottom-toolbar">
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

        <paper-tabs
          class="nav-items"
          .selected="${this.selectedTab}"
          attr-for-selected="day"
          ?hidden="${this.pending}"
          scrollable
          hide-scroll-buttons
          noink
        >
          ${this.days.map(
            (day) => html`
              <paper-tab class="nav-item" day="${day.date}" link>
                <a
                  href="${this.addQueryParams(day.date, this.location?.search)}"
                  layout
                  vertical
                  center-center
                  >${day.dateReadable}</a
                >
              </paper-tab>
            `,
          )}
          <paper-tab class="nav-item" day="my-schedule" ?hidden="${!this.signedIn}" link>
            <a
              href="${this.addQueryParams('my-schedule', this.location?.search)}"
              layout
              vertical
              center-center
              >${this.mySchedule.title}</a
            >
          </paper-tab>
        </paper-tabs>
      </app-toolbar>
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
