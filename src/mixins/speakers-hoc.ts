import { fetchSpeakersList } from '../store/speakers/actions';
import { RootState, store } from '../store';

/* @polymerMixin */
export const SpeakersHoC = (subclass) =>
  class extends subclass {
    protected speakers = [];
    protected speakersMap = {};
    protected speakersFetching = false;
    protected speakersFetchingError = {};

    static get properties() {
      return {
        ...super.properties,
        speakers: Array,
        speakersMap: Object,
        speakersFetching: Boolean,
        speakersFetchingError: Object,
      };
    }

    stateChanged(state: RootState) {
      super.stateChanged(state);
      this.setProperties({
        speakers: state.speakers.list,
        speakersMap: state.speakers.obj,
        speakersFetching: state.speakers.fetching,
        speakersFetchingError: state.speakers.fetchingError,
      });
    }

    connectedCallback() {
      super.connectedCallback();

      if (!this.speakersFetching && (!this.speakers || !this.speakers.length)) {
        store.dispatch(fetchSpeakersList());
      }
    }
  };
