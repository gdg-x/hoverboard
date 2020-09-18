import '@polymer/app-route/app-route';
import '@polymer/iron-location/iron-location';
import '@polymer/iron-pages';
import '@polymer/paper-progress';
import { html, PolymerElement } from '@polymer/polymer';
import '../elements/content-loader';
import '../elements/filter-menu';
import '../elements/header-bottom-toolbar';
import '../elements/my-schedule';
import '../elements/schedule-day';
import '../elements/shared-styles';
import '../elements/sticky-element';
import { ReduxMixin } from '../mixins/redux-mixin';
import { SessionsHoC } from '../mixins/sessions-hoc';
import { SpeakersHoC } from '../mixins/speakers-hoc';
import { closeDialog, openDialog } from '../store/dialogs/actions';
import { DIALOGS } from '../store/dialogs/types';
import { setSubRoute } from '../store/routing/actions';
import { fetchSchedule } from '../store/schedule/actions';
import { fetchUserFeaturedSessions } from '../store/sessions/actions';
import { RootState, store } from '../store';
import { parseQueryParamsFilters } from '../utils/functions';
import { customElement, observe, property } from '@polymer/decorators';

@customElement('schedule-page')
export class SchedulePage extends SessionsHoC(SpeakersHoC(ReduxMixin(PolymerElement))) {
  static get template() {
    return html`
      <style include="shared-styles flex flex-alignment">
        :host {
          display: block;
          height: 100%;
        }

        .container {
          min-height: 80%;
        }

        paper-progress {
          width: 100%;
          --paper-progress-active-color: var(--default-primary-color);
          --paper-progress-secondary-color: var(--default-primary-color);
        }

        @media (max-width: 640px) {
          .container {
            padding: 0 0 32px;
          }
        }

        @media (min-width: 640px) {
          :host {
            background-color: #fff;
          }
        }
      </style>

      <polymer-helmet
        title="{$ heroSettings.schedule.title $} | {$ title $}"
        description="{$ heroSettings.schedule.metaDescription $}"
        active="[[_setHelmetData(active, isSpeakerDialogOpened, isSessionDialogOpened)]]"
      ></polymer-helmet>

      <iron-location query="{{queryParams}}"></iron-location>

      <app-route
        route="{{appRoute}}"
        pattern="/:page"
        data="{{routeData}}"
        tail="{{subRoute}}"
        query-params="{{nQueryParams}}"
      ></app-route>

      <app-route route="[[route]]" pattern="/:day" data="{{routeData}}"></app-route>

      <hero-block
        background-image="{$ heroSettings.schedule.background.image $}"
        background-color="{$ heroSettings.schedule.background.color $}"
        font-color="{$ heroSettings.schedule.fontColor $}"
        active="[[active]]"
      >
        <div class="hero-title">{$ heroSettings.schedule.title $}</div>
        <p class="hero-description">{$ heroSettings.schedule.description $}</p>
        <sticky-element slot="bottom" active="[[active]]">
          <header-bottom-toolbar></header-bottom-toolbar>
        </sticky-element>
      </hero-block>

      <paper-progress indeterminate hidden$="[[contentLoaderVisibility]]"></paper-progress>

      <filter-menu filters="[[_filters]]" selected="[[_selectedFilters]]"></filter-menu>

      <div class="container">
        <content-loader
          card-padding="15px"
          card-margin="16px 0"
          card-height="140px"
          avatar-size="0"
          avatar-circle="0"
          title-top-position="20px"
          title-height="42px"
          title-width="70%"
          load-from="-20%"
          load-to="80%"
          blur-width="300px"
          items-count="{$ contentLoaders.schedule.itemsCount $}"
          hidden$="[[contentLoaderVisibility]]"
          layout
        >
        </content-loader>

        <iron-pages attr-for-selected="name" selected="[[subRoute]]" selected-attribute="active">
          <template is="dom-repeat" items="[[schedule]]" as="day">
            <schedule-day
              name$="[[day.date]]"
              day="[[day]]"
              user="[[user]]"
              featured-sessions="[[featuredSessions]]"
              selected-filters="[[_selectedFilters]]"
              viewport="[[viewport]]"
              query-params="[[queryParams]]"
            ></schedule-day>
          </template>
          <my-schedule
            name="my-schedule"
            schedule="[[schedule]]"
            user="[[user]]"
            featured-sessions="[[featuredSessions]]"
            selected-filters="[[_selectedFilters]]"
            viewport="[[viewport]]"
            query-params="[[queryParams]]"
          ></my-schedule>
        </iron-pages>
      </div>

      <footer-block></footer-block>
    `;
  }

  @property({ type: Object })
  private route = {};
  @property({ type: Object })
  private queryParams = {};
  @property({ type: Boolean })
  private active = false;
  @property({ type: Array })
  private schedule = [];
  @property({ type: Object })
  private featuredSessions = {};
  @property({ type: Object })
  private user = {};
  @property({ type: Object })
  private subRoute = {};
  @property({ type: Object })
  private isSpeakerDialogOpened = {};
  @property({ type: Object })
  private isSessionDialogOpened = {};
  @property({ type: Boolean })
  private contentLoaderVisibility = false;
  @property({ type: Object })
  private viewport = {};
  @property({ type: Object })
  private filters = {};
  @property({ type: Array })
  private _filters = [];
  @property({ type: Object })
  private _selectedFilters = {};
  @property({ type: Object })
  private routeData = {};
  @property({ type: Object })
  private appRoute = {};
  @property({ type: Object })
  private nQueryParams = {};

  stateChanged(state: RootState) {
    super.stateChanged(state);
    this.featuredSessions = state.sessions.featured;
    this.filters = state.filters;
    this.isSessionDialogOpened = state.dialogs.session.isOpened;
    this.isSpeakerDialogOpened = state.dialogs.speaker.isOpened;
    this.schedule = state.schedule;
    this.subRoute = state.routing.subRoute;
    this.user = state.user;
    this.viewport = state.ui.viewport;
  }

  @observe('sessions', 'speakers')
  _sessionsAndSpeakersChanged(sessions, speakers) {
    if (!this.schedule.length && sessions && sessions.length && speakers && speakers.length) {
      store.dispatch(fetchSchedule());
    }
  }

  @observe('schedule', '_selectedFilters')
  _scheduleChanged(schedule) {
    if (schedule && schedule.length) {
      this.contentLoaderVisibility = true;
    }
  }

  @observe('active', 'sessions', 'user.uid')
  _fetchFeaturedSessions(active, sessions, userUid) {
    if (
      active &&
      userUid &&
      sessions &&
      sessions.length &&
      (!this.featuredSessions || !Object.keys(this.featuredSessions).length)
    ) {
      store.dispatch(fetchUserFeaturedSessions(userUid));
    }
  }

  @observe('active', 'routeData.day', 'schedule')
  _setDay(active, day, schedule) {
    if (active && schedule.length) {
      const selectedDay = day || schedule[0].date;
      setSubRoute(selectedDay);
    }
  }

  @observe('active', 'sessions', '_selectedFilters.sessionId')
  _openSessionDetails(active, sessions, id) {
    if (sessions && sessions.length) {
      requestAnimationFrame(() => {
        if (active && id) {
          openDialog(DIALOGS.SESSION, this.sessionsMap[id[0]]);
        } else {
          this.isSessionDialogOpened && closeDialog(DIALOGS.SESSION);
        }
      });
    }
  }

  _setHelmetData(active, isSpeakerDialogOpened, isSessionDialogOpened) {
    return active && !isSpeakerDialogOpened && !isSessionDialogOpened;
  }

  @observe('filters')
  _onFiltersLoad(filters) {
    this._filters = [
      {
        title: '{$ filters.tags $}',
        key: 'tag',
        items: filters.tags,
      },
      {
        title: '{$ filters.complexity $}',
        key: 'complexity',
        items: filters.complexity,
      },
    ];
  }

  @observe('queryParams')
  _paramsUpdated(queryParams: string) {
    this._selectedFilters = parseQueryParamsFilters(queryParams);
  }
}
