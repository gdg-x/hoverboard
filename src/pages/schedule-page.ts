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
import { dialogsActions, routingActions, scheduleActions, sessionsActions } from '../redux/actions';
import { DIALOGS } from '../redux/constants';
import { State, store } from '../redux/store';
import { parseQueryParamsFilters } from '../utils/functions';

class SchedulePage extends SessionsHoC(SpeakersHoC(ReduxMixin(PolymerElement))) {
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

  static get is() {
    return 'schedule-page';
  }

  private route = {};
  private queryParams = {};
  private active = false;
  private schedule = [];
  private featuredSessions = {};
  private user = {};
  private subRoute = {};
  private isSpeakerDialogOpened = {};
  private isSessionDialogOpened = {};
  private contentLoaderVisibility = false;
  private viewport = {};
  private filters = {};
  private _selectedFilters = {};
  private routeData = {};
  private appRoute = {};
  private nQueryParams = {};

  static get properties() {
    return {
      ...super.properties,
      route: Object,
      queryParams: Object,
      active: Boolean,
      schedule: Array,
      featuredSessions: Object,
      user: Object,
      subRoute: Object,
      isSpeakerDialogOpened: Object,
      isSessionDialogOpened: Object,
      contentLoaderVisibility: Boolean,
      viewport: Object,
      nQueryParams: Object,
      routeData: Object,
      appRoute: Object,
      filters: {
        type: Object,
        observer: '_onFiltersLoad',
      },
      _selectedFilters: Object,
      _filters: Array,
    };
  }

  stateChanged(state: State) {
    super.stateChanged(state);
    this.setProperties({
      featuredSessions: state.sessions.featured,
      filters: state.filters,
      isSessionDialogOpened: state.dialogs.session.isOpened,
      isSpeakerDialogOpened: state.dialogs.speaker.isOpened,
      schedule: state.schedule,
      subRoute: state.routing.subRoute,
      user: state.user,
      viewport: state.ui.viewport,
    });
  }

  static get observers() {
    return [
      '_setDay(active, routeData.day, schedule)',
      '_openSessionDetails(active, sessions, _selectedFilters.sessionId)',
      '_fetchFeaturedSessions(active, sessions, user.uid)',
      '_scheduleChanged(schedule, _selectedFilters)',
      '_sessionsAndSpeakersChanged(sessions, speakers)',
      '_paramsUpdated(queryParams)',
    ];
  }

  _sessionsAndSpeakersChanged(sessions, speakers) {
    if (!this.schedule.length && sessions && sessions.length && speakers && speakers.length) {
      store.dispatch(scheduleActions.fetchSchedule());
    }
  }

  _scheduleChanged(schedule) {
    if (schedule && schedule.length) {
      this.contentLoaderVisibility = true;
    }
  }

  _fetchFeaturedSessions(active, sessions, userUid) {
    if (
      active &&
      userUid &&
      sessions &&
      sessions.length &&
      (!this.featuredSessions || !Object.keys(this.featuredSessions).length)
    ) {
      store.dispatch(sessionsActions.fetchUserFeaturedSessions(userUid));
    }
  }

  _setDay(active, day, schedule) {
    if (active && schedule.length) {
      const selectedDay = day || schedule[0].date;
      routingActions.setSubRoute(selectedDay);
    }
  }

  _openSessionDetails(active, sessions, id) {
    if (sessions && sessions.length) {
      requestAnimationFrame(() => {
        if (active && id) {
          dialogsActions.openDialog(DIALOGS.SESSION, this.sessionsMap[id[0]]);
        } else {
          this.isSessionDialogOpened && dialogsActions.closeDialog(DIALOGS.SESSION);
        }
      });
    }
  }

  _setHelmetData(active, isSpeakerDialogOpened, isSessionDialogOpened) {
    return active && !isSpeakerDialogOpened && !isSessionDialogOpened;
  }

  _onFiltersLoad(filters) {
    this.set('_filters', [
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
    ]);
  }

  _paramsUpdated(queryParams) {
    this.set('_selectedFilters', parseQueryParamsFilters(queryParams));
  }
}

window.customElements.define(SchedulePage.is, SchedulePage);
