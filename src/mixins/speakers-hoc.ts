import { property } from '@polymer/decorators';
import { PolymerElement } from '@polymer/polymer';
import { Constructor } from 'lit-element';
import { RootState, store } from '../store';
import { fetchSpeakersList } from '../store/speakers/actions';

/* @polymerMixin */
export const SpeakersHoC = <
  T extends Constructor<PolymerElement & { stateChanged(_state: RootState): void }>
>(
  subclass: T
) => {
  class SpeakersClass extends subclass {
    @property({ type: Array })
    protected speakers = [];
    @property({ type: Object })
    protected speakersMap = {};
    @property({ type: Boolean })
    protected speakersFetching = false;
    @property({ type: Object })
    protected speakersFetchingError = {};

    stateChanged(state: RootState) {
      super.stateChanged(state);
      this.speakers = state.speakers.list;
      this.speakersMap = state.speakers.obj;
      this.speakersFetching = state.speakers.fetching;
      this.speakersFetchingError = state.speakers.fetchingError;
    }

    connectedCallback() {
      super.connectedCallback();

      if (!this.speakersFetching && (!this.speakers || !this.speakers.length)) {
        store.dispatch(fetchSpeakersList());
      }
    }
  }

  return SpeakersClass;
};
