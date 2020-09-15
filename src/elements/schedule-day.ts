import { html, PolymerElement } from '@polymer/polymer';
import { TempAny } from '../temp-any';
import { generateClassName } from '../utils/functions';
import { offsetTop, scrollToY } from '../utils/scrolling';
import './session-element';
import './shared-styles';

class ScheduleDay extends PolymerElement {
  static get template() {
    return html`
      <style include="shared-styles flex flex-alignment positioning">
        :host {
          display: block;
          --tracks-number: 3;
        }

        .start-time {
          margin-top: 16px;
          padding: 8px 16px;
          color: var(--secondary-text-color);
          letter-spacing: -0.04em;
          border-bottom: 1px solid var(--border-light-color);
        }

        .hours {
          font-size: 24px;
          font-weight: 300;
        }

        .minutes {
          font-size: 16px;
        }

        .add-session {
          padding: 8px;
          grid-column-end: -1 !important;
          background-color: var(--primary-background-color);
          border-bottom: 1px solid var(--border-light-color);
          font-size: 14px;
          color: var(--secondary-text-color);
        }

        .add-session:hover {
          background-color: var(--additional-background-color);
        }

        .add-session-icon {
          --iron-icon-width: 14px;
          margin-right: 8px;
        }

        @media (min-width: 812px) {
          :host {
            margin-left: auto;
            display: block;
            max-width: calc(100% - 64px);
          }

          .grid {
            display: grid;
            grid-column-gap: 16px;
            grid-row-gap: 32px;
            grid-template-columns: repeat(var(--tracks-number), 1fr);
          }

          .start-time {
            margin: 0;
            padding: 0;
            text-align: right;
            transform: translateX(calc(-100% - 16px));
            border-bottom: 0;
          }

          .hours {
            font-size: 32px;
          }

          .subsession:not(:last-of-type) {
            margin-bottom: 16px;
          }

          .add-session {
            border: 1px solid var(--border-light-color);
          }
        }
      </style>

      <div class="grid" style$="--tracks-number: [[day.tracks.length]];">
        <template is="dom-repeat" items="[[day.timeslots]]" as="timeslot" index-as="timeslotIndex">
          <div
            id$="[[timeslot.startTime]]"
            class="start-time"
            style$="grid-area: [[_getTimePosition(timeslotIndex)]]"
          >
            <span class="hours">[[_splitText(timeslot.startTime, ':', 0)]]</span>
            <span class="minutes">[[_splitText(timeslot.startTime, ':', 1)]]</span>
          </div>

          <a
            class="add-session"
            href$="/schedule/[[day.date]]#[[timeslot.startTime]]"
            hidden$="[[!_showAddSession(timeslot, onlyFeatured)]]"
            style$="grid-area: [[timeslot.sessions.0.gridArea]]"
            layout
            horizontal
            center-center
          >
            <iron-icon class="add-session-icon" icon="hoverboard:add-circle-outline"></iron-icon>
            <span>{$ mySchedule.browseSession $}</span>
          </a>

          <template
            is="dom-repeat"
            items="[[timeslot.sessions]]"
            as="session"
            index-as="sessionIndex"
            filter="_isNotEmpty"
          >
            <div class="session" style$="grid-area: [[session.gridArea]]" layout vertical>
              <template
                is="dom-repeat"
                items="[[_filterSessions(session.items, selectedFilters)]]"
                as="subSession"
              >
                <session-element
                  class="subsession"
                  day-name="[[name]]"
                  session="[[subSession]]"
                  user="[[user]]"
                  featured-sessions="[[featuredSessions]]"
                  query-params="[[queryParams]]"
                ></session-element>
              </template>
            </div>
          </template>
        </template>
      </div>
    `;
  }

  static get is() {
    return 'schedule-day';
  }

  private active = false;
  private day = {};
  private name: string;
  private user = {};
  private featuredSessions = {};
  private onlyFeatured = false;
  private viewport: { isTabletPlus?: boolean } = {};
  private selectedFilters = {};
  private queryParams: string;

  static get properties() {
    return {
      active: {
        type: Boolean,
        observer: '_pageVisible',
      },
      day: Object,
      name: String,
      user: Object,
      featuredSessions: Object,
      onlyFeatured: Boolean,
      viewport: Object,
      selectedFilters: Object,
      queryParams: String,
    };
  }

  _pageVisible(active) {
    if (active && window.location.hash) {
      const selectedTime = window.location.hash.slice(1);
      if (selectedTime) {
        requestAnimationFrame(() => {
          const Elements = (window as TempAny).HOVERBOARD.Elements;
          const targetElement = this.shadowRoot.querySelector(`[id="${selectedTime}"]`);
          const offset = offsetTop(targetElement);
          const toolbarHeight = Elements.HeaderToolbar.getBoundingClientRect().height - 1;
          const stickyToolbarHeight = Elements.StickyHeaderToolbar.getBoundingClientRect().height;
          const additionalMargin = this.viewport.isTabletPlus ? 8 : 0;
          const scrollTargetY = offset - toolbarHeight - stickyToolbarHeight - additionalMargin;
          scrollToY(scrollTargetY, 1500, 'easeInOutSine');
        });
      }
    }
  }

  _getTimePosition(timeslotIndex) {
    return `${timeslotIndex + 1} / 1`;
  }

  _splitText(text, divider, index) {
    return text.split(divider)[index];
  }

  _showAddSession(timeslot, onlyFeatured) {
    return (
      onlyFeatured &&
      !timeslot.sessions.reduce(
        (aggregator, sessionBlock) => aggregator + sessionBlock.items.length,
        0
      )
    );
  }

  _isNotEmpty(sessionBlock) {
    return !!sessionBlock.items.length;
  }

  _filterSessions(sessions, selectedFilters) {
    if (!selectedFilters) return sessions;
    return sessions.filter((session) => {
      return (
        (!selectedFilters.tag ||
          !selectedFilters.tag.length ||
          (session.tags &&
            !!session.tags.filter((tag) => selectedFilters.tag.includes(generateClassName(tag)))
              .length)) &&
        (!selectedFilters.complexity ||
          !selectedFilters.complexity.length ||
          (session.complexity &&
            selectedFilters.complexity.includes(generateClassName(session.complexity))))
      );
    });
  }
}

window.customElements.define(ScheduleDay.is, ScheduleDay);
