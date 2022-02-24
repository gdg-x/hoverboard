import { Initialized, Success } from '@abraham/remotedata';
import { createSelector } from '@reduxjs/toolkit';
import { RootState, store } from '..';
import { PreviousSpeaker } from '../../models/previous-speaker';
import { randomOrder } from '../../utils/arrays';
import { selectViewport } from '../ui/selectors';
import { Viewport } from '../ui/types';
import { fetchPreviousSpeakers } from './actions';

const selectSpeakerId = (_state: RootState, speakerId: string) => speakerId;

const selectPreviousSpeakers = (state: RootState): PreviousSpeaker[] => {
  const { previousSpeakers } = state;
  if (previousSpeakers instanceof Success) {
    return previousSpeakers.data;
  } else if (previousSpeakers instanceof Initialized) {
    store.dispatch(fetchPreviousSpeakers);
  }
  return [];
};

export const selectPreviousSpeaker = createSelector(
  selectPreviousSpeakers,
  selectSpeakerId,
  (speakers: PreviousSpeaker[], speakerId: string): PreviousSpeaker | undefined => {
    return speakers.find((speaker) => speaker.id === speakerId);
  }
);

export const selectRandomPreviousSpeakers = createSelector(
  selectPreviousSpeakers,
  selectViewport,
  (previousSpeakers: PreviousSpeaker[], viewport: Viewport): PreviousSpeaker[] => {
    const displayCount = viewport.isPhone ? 8 : 14;
    return randomOrder(previousSpeakers).slice(0, displayCount);
  }
);
