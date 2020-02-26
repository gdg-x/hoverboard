import { speakersActions } from '../redux/actions.js';
import { ReduxMixin } from './redux-mixin.js';

/* @polymerMixin */
export const SpeakersHoC = (subclass) => class extends ReduxMixin(subclass) {
  static get properties() {
    let parentProps = {};
    try {
      parentProps = super.properties;
    } catch (_error) {
      // ignore parents that don't have `properties
    }

    return {
      ...parentProps,
      speakers: {
        type: Array,
      },
      speakersMap: {
        type: Object,
      },
      speakersFetching: {
        type: Boolean,
      },
      speakersFetchingError: {
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
      speakers: state.speakers.list,
      speakersMap: state.speakers.obj,
      speakersFetching: state.speakers.fetching,
      speakersFetchingError: state.speakers.fetchingError,
    };
  }

  connectedCallback() {
    super.connectedCallback();

    if (!this.speakersFetching && (!this.speakers || !this.speakers.length)) {
      this.dispatchAction(speakersActions.fetchList());
    }
  }
};
