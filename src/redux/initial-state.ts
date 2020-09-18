import { initialBlogState } from './blog/state';
import { NOTIFICATIONS_STATUS } from './constants';
import { initialDialogState } from './dialogs/state';
import { initialFeedbackState } from './feedback/state';
import { initialFiltersState } from './filters/state';
import { initialUiState } from './ui/state';

export const initialState = {
  ui: initialUiState,
  routing: {
    route: 'home',
    subRoute: '',
  },
  dialogs: initialDialogState,
  tickets: {
    fetching: false,
    fetchingError: null,
    list: [],
  },
  videos: {
    fetching: false,
    fetchingError: null,
    list: [],
  },
  feedback: initialFeedbackState,
  blog: initialBlogState,
  partners: {
    fetching: false,
    fetchingError: null,
    list: [],
    adding: false,
    addingError: false,
  },
  previousSpeakers: {
    fetching: false,
    fetchingError: null,
    list: [],
    obj: {},
  },
  speakers: {
    fetching: false,
    fetchingError: null,
    list: [],
    obj: {},
  },
  sessions: {
    fetching: false,
    fetchingError: null,
    list: [],
    obj: {},
    objBySpeaker: {},
    featured: {},
    featuredFetching: false,
    featuredError: null,
  },
  schedule: [],
  gallery: {
    fetching: false,
    fetchingError: null,
    list: [],
  },
  team: {
    fetching: false,
    fetchingError: null,
    list: [],
  },
  user: {
    signedIn: false,
  },
  subscribed: false,
  toast: {},
  notifications: {
    status: NOTIFICATIONS_STATUS.DEFAULT,
  },
  filters: initialFiltersState,
};
