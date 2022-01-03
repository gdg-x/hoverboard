import { Initialized } from '@abraham/remotedata';
import { Constructor } from '@lit/reactive-element/decorators';
import { property } from '@polymer/decorators';
import { PolymerElement } from '@polymer/polymer';
import { RootState, store } from '../store';
import { fetchSessions } from '../store/sessions/actions';
import { initialSessionsState } from '../store/sessions/state';

/* @polymerMixin */
export const SessionsMixin = <
  T extends Constructor<PolymerElement & { stateChanged(_state: RootState): void }>
>(
  subclass: T
) => {
  class SessionsClass extends subclass {
    @property({ type: Object })
    protected sessions = initialSessionsState;

    override stateChanged(state: RootState) {
      super.stateChanged(state);
      this.sessions = state.sessions;
    }

    override connectedCallback() {
      super.connectedCallback();

      if (this.sessions instanceof Initialized) {
        store.dispatch(fetchSessions);
      }
    }
  }

  return SessionsClass;
};
