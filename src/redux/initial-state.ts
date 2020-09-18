import { initialBlogState } from './blog/state';
import { NOTIFICATIONS_STATUS } from './constants';
import { initialDialogState } from './dialogs/state';
import { initialFeedbackState } from './feedback/state';
import { initialFiltersState } from './filters/state';
import { initialGalleryState } from './gallery/store';
import { initialPartnersState } from './partners/state';
import { initialSubscribeState } from './subscribe/state';
import { initialTeamState } from './team/state';
import { initialTicketsState } from './tickets/state';
import { initialToastState } from './toast/state';
import { initialUiState } from './ui/state';
import { initialVideosState } from './videos/state';

export const initialState = {
  ui: initialUiState,
  routing: {
    route: 'home',
    subRoute: '',
  },
  dialogs: initialDialogState,
  tickets: initialTicketsState,
  videos: initialVideosState,
  feedback: initialFeedbackState,
  blog: initialBlogState,
  partners: initialPartnersState,
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
  gallery: initialGalleryState,
  team: initialTeamState,
  user: {
    signedIn: false,
  },
  subscribed: initialSubscribeState,
  toast: initialToastState,
  notifications: {
    status: NOTIFICATIONS_STATUS.DEFAULT,
  },
  filters: initialFiltersState,
};
