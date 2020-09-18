import { FeedbackState } from './types';

export const initialFeedbackState: FeedbackState = {
  adding: false,
  addingError: null,
  fetching: false,
  fetchingError: null,
  deleting: false,
  deletingError: null,
};
