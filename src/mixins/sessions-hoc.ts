import { sessionsActions } from '../redux/actions';
import { store } from '../redux/store';

/* @polymerMixin */
export const SessionsHoC = (subclass) =>
  class extends subclass {
    protected sessions = [];
    protected sessionsMap = {};
    protected sessionsBySpeaker = {};
    protected sessionsFetching = false;
    protected sessionsFetchingError = {};

    static get properties() {
      return {
        ...super.properties,
        sessions: Array,
        sessionsMap: Object,
        sessionsBySpeaker: Object,
        sessionsFetching: Boolean,
        sessionsFetchingError: Object,
      };
    }

    stateChanged(state: import('../redux/store').State) {
      super.stateChanged(state);
      this.setProperties({
        sessions: state.sessions.list,
        sessionsMap: state.sessions.obj,
        sessionsBySpeaker: state.sessions.objBySpeaker,
        sessionsFetching: state.sessions.fetching,
        sessionsFetchingError: state.sessions.fetchingError,
      });
    }

    connectedCallback() {
      super.connectedCallback();

      if (!this.sessionsFetching && (!this.sessions || !this.sessions.length)) {
        store.dispatch(sessionsActions.fetchList());
      }
    }
  };
