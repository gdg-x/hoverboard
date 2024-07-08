import { combineReducers } from '@reduxjs/toolkit';
import { filtersReducer } from './filters/reducers';
import { galleryReducer } from './gallery/reducers';
import { membersReducer } from './members/reducers';
import partners from './partners';
import { previousSpeakersReducer } from './previous-speakers/reducers';
import { sessionsReducer } from './sessions/reducers';
import snackbars from './snackbars';
import { speakersReducer } from './speakers/reducers';
import { teamsReducer } from './teams/reducers';
import { ticketsReducer } from './tickets/reducers';
import { uiReducer } from './ui/reducers';
import { videosReducer } from './videos/reducers';

export const reducers = combineReducers({
  filters: filtersReducer,
  gallery: galleryReducer,
  members: membersReducer,
  partners,
  previousSpeakers: previousSpeakersReducer,
  sessions: sessionsReducer,
  snackbars,
  speakers: speakersReducer,
  teams: teamsReducer,
  tickets: ticketsReducer,
  ui: uiReducer,
  videos: videosReducer,
});
