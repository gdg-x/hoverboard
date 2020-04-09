import { DIALOGS, NOTIFICATIONS_STATUS } from './constants';

export const initialState = {
  ui: {
    viewport: {
      isPhone: true,
      isTabletPlus: false,
    },
    videoDialog: {
      opened: false,
      disableControls: false,
      youtubeId: '',
      title: '',
    },
    heroSettings: {},
  },
  routing: {
    route: 'home',
    subRoute: '',
  },
  dialogs: {
    [DIALOGS.SPEAKER]: {
      isOpened: false,
      data: {},
    },
    [DIALOGS.PREVIOUS_SPEAKER]: {
      isOpened: false,
      data: {},
    },
    [DIALOGS.SESSION]: {
      isOpened: false,
      data: {},
    },
    [DIALOGS.FEEDBACK]: {
      isOpened: false,
      data: {},
    },
    [DIALOGS.SUBSCRIBE]: {
      isOpened: false,
      data: {},
    },
    [DIALOGS.SIGNIN]: {
      isOpened: false,
      data: {},
    },
  },
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
  feedback: {
    adding: false,
    addingError: null,
    fetching: false,
    fetchingError: null,
    deleting: false,
    deletingError: null,
  },
  blog: {
    fetching: false,
    fetchingError: null,
    list: [],
    obj: {},
  },
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
  filters: {
    tags: [],
    complexity: [],
  },
};
