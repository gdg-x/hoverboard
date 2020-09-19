import { property } from '@polymer/decorators';
import { PolymerElement } from '@polymer/polymer';
import { Constructor } from 'lit-element';
import { RootState, store } from '../store';
import { fetchSessionsList } from '../store/sessions/actions';

/* @polymerMixin */
export const SessionsHoC = <
  T extends Constructor<PolymerElement & { stateChanged(_state: RootState): void }>
>(
  subclass: T
) => {
  class SessionsClass extends subclass {
    @property({ type: Array })
    protected sessions = [];
    @property({ type: Object })
    protected sessionsMap = {};
    @property({ type: Boolean })
    protected sessionsFetching = false;
    @property({ type: Object })
    protected sessionsFetchingError = {};

    stateChanged(state: RootState) {
      super.stateChanged(state);
      this.sessions = state.sessions.list;
      this.sessionsMap = state.sessions.obj;
      this.sessionsFetching = state.sessions.fetching;
      this.sessionsFetchingError = state.sessions.fetchingError;
    }

    connectedCallback() {
      super.connectedCallback();

      if (!this.sessionsFetching && (!this.sessions || !this.sessions.length)) {
        store.dispatch(fetchSessionsList());
      }
    }
  }

  return SessionsClass;
};
