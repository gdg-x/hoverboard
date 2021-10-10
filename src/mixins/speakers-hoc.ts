import { Pending } from '@abraham/remotedata';
import { Constructor } from '@lit/reactive-element/decorators';
import { property } from '@polymer/decorators';
import { PolymerElement } from '@polymer/polymer';
import { RootState, store } from '../store';
import { fetchSpeakersList } from '../store/speakers/actions';
import { initialSpeakersState, SpeakersState } from '../store/speakers/state';

/* @polymerMixin */
export const SpeakersHoC = <
  T extends Constructor<PolymerElement & { stateChanged(_state: RootState): void }>
>(
  subclass: T
) => {
  class SpeakersClass extends subclass {
    @property({ type: Object })
    speakers: SpeakersState = initialSpeakersState;

    stateChanged(state: RootState) {
      super.stateChanged(state);
      this.speakers = state.speakers;
    }

    connectedCallback() {
      super.connectedCallback();

      if (this.speakers instanceof Pending) {
        store.dispatch(fetchSpeakersList());
      }
    }
  }

  return SpeakersClass;
};
