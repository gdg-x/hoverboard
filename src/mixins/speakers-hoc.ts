import { speakersActions } from '../redux/actions';
import { State, store } from '../redux/store';

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

    stateChanged(state: State) {
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
        store.dispatch(speakersActions.fetchList());
      }
    }
  };
