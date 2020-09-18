// router
export const SET_ROUTE = 'app/Routing/SET_ROUTE';
export const SET_SUB_ROUTE = 'app/Routing/SET_SUB_ROUTE';

// speakers
export const FETCH_SPEAKERS = 'app/Speakers/FETCH_SPEAKERS';
export const FETCH_SPEAKERS_FAILURE = 'app/Speakers/FETCH_SPEAKERS_FAILURE';
export const FETCH_SPEAKERS_SUCCESS = 'app/Speakers/FETCH_SPEAKERS_SUCCESS';

// previous speakers
export const FETCH_PREVIOUS_SPEAKERS = 'app/PreviousSpeakers/FETCH_SPEAKERS';
export const FETCH_PREVIOUS_SPEAKERS_FAILURE = 'app/PreviousSpeakers/FETCH_SPEAKERS_FAILURE';
export const FETCH_PREVIOUS_SPEAKERS_SUCCESS = 'app/PreviousSpeakers/FETCH_SPEAKERS_SUCCESS';

// sessions
export const FETCH_SESSIONS = 'app/Sessions/FETCH_SESSIONS';
export const FETCH_SESSIONS_FAILURE = 'app/Sessions/FETCH_SESSIONS_FAILURE';
export const FETCH_SESSIONS_SUCCESS = 'app/Sessions/FETCH_SESSIONS_SUCCESS';
export const UPDATE_SESSIONS = 'app/Sessions/UPDATE_SESSIONS';

export const FETCH_USER_FEATURED_SESSIONS = 'app/Sessions/FETCH_USER_FEATURED_SESSIONS';
export const FETCH_USER_FEATURED_SESSIONS_FAILURE =
  'app/Sessions/FETCH_USER_FEATURED_SESSIONS_FAILURE';
export const FETCH_USER_FEATURED_SESSIONS_SUCCESS =
  'app/Sessions/FETCH_USER_FEATURED_SESSIONS_SUCCESS';

export const SET_USER_FEATURED_SESSIONS = 'app/Sessions/SET_USER_FEATURED_SESSIONS';
export const SET_USER_FEATURED_SESSIONS_FAILURE = 'app/Sessions/SET_USER_FEATURED_SESSIONS_FAILURE';
export const SET_USER_FEATURED_SESSIONS_SUCCESS = 'app/Sessions/SET_USER_FEATURED_SESSIONS_SUCCESS';
// schedule
export const FETCH_SCHEDULE = 'app/Schedule/FETCH_SCHEDULE';
export const FETCH_SCHEDULE_FAILURE = 'app/Schedule/FETCH_SCHEDULE_FAILURE';
export const FETCH_SCHEDULE_SUCCESS = 'app/Schedule/FETCH_SCHEDULE_SUCCESS';

// user
export const SIGN_IN = 'app/Auth/SIGN_IN';
export const SIGN_OUT = 'app/Auth/SIGN_OUT';

// notifications
export const UPDATE_NOTIFICATIONS_STATUS = 'app/Notifications/UPDATE_NOTIFICATIONS_STATUS';
export const NOTIFICATIONS_STATUS = {
  GRANTED: 'granted',
  DENIED: 'denied',
  DEFAULT: 'default',
};
