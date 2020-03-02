import { sessionsActions } from '../redux/actions.js';
import { ReduxMixin } from './redux-mixin.js';

/* @polymerMixin */
export const SessionsHoC = (subclass) => class extends ReduxMixin(subclass) {
  static get properties() {
    let parentProps = {};
    try {
      parentProps = super.properties;
    } catch (_error) {
      // ignore parents that don't have `properties
    }

    return {
      ...parentProps,
      sessions: {
        type: Array,
      },
      sessionsMap: {
        type: Object,
      },
      sessionsBySpeaker: {
        type: Object,
      },
      sessionsFetching: {
        type: Boolean,
      },
      sessionsFetchingError: {
        type: Object,
      },
    };
  }

  static mapStateToProps(state, _element) {
    let parentMap = {};
    try {
      parentMap = super.mapStateToProps(state, _element);
    } catch (_error) {
      // ignore parents that don't have `mapStateToProps
    }


    return {
      ...parentMap,
      sessions: state.sessions.list,
      sessionsMap: state.sessions.obj,
      sessionsBySpeaker: state.sessions.objBySpeaker,
      sessionsFetching: state.sessions.fetching,
      sessionsFetchingError: state.sessions.fetchingError,
    };
  }

  connectedCallback() {
    super.connectedCallback();

    if (!this.sessionsFetching && (!this.sessions || !this.sessions.length)) {
      this.dispatchAction(sessionsActions.fetchList());
    }
  }
};
