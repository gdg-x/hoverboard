import { SpeakersState } from './types';

export const initialSpeakersState: SpeakersState = {
  fetching: false,
  fetchingError: null,
  list: [],
  obj: {},
};
