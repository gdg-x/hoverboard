import { Initialized } from '@abraham/remotedata';
import { Constructor } from '@lit/reactive-element/decorators';
import { property } from '@polymer/decorators';
import { PolymerElement } from '@polymer/polymer';
import { RootState, store } from '../store';
import { fetchSpeakers } from '../store/speakers/actions';
import { initialSpeakersState } from '../store/speakers/state';

/* @polymerMixin */
export const SpeakersMixin = <
  T extends Constructor<PolymerElement & { stateChanged(_state: RootState): void }>
>(
  subclass: T
) => {
  class SpeakersClass extends subclass {
    @property({ type: Object })
    speakers = initialSpeakersState;

    override stateChanged(state: RootState) {
      super.stateChanged(state);
      this.speakers = state.speakers;
    }

    override connectedCallback() {
      super.connectedCallback();

      if (this.speakers instanceof Initialized) {
        store.dispatch(fetchSpeakers);
      }
    }
  }

  return SpeakersClass;
};
