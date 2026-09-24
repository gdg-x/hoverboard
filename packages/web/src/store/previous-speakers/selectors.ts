import { Success } from '@abraham/remotedata';
import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '..';
import { PreviousSpeaker } from '../../models/previous-speaker';
import { randomOrder } from '../../utils/arrays';
import { selectViewport, Viewport } from '../ui';
import { selectPreviousSpeakersState } from '.';

const selectSpeakerId = (_state: RootState, speakerId: string) => speakerId;

const selectPreviousSpeakers = (state: RootState): PreviousSpeaker[] => {
  const previousSpeakers = selectPreviousSpeakersState(state);
  return previousSpeakers instanceof Success ? previousSpeakers.data : [];
};

export const selectPreviousSpeaker = createSelector(
  selectPreviousSpeakers,
  selectSpeakerId,
  (speakers: PreviousSpeaker[], speakerId: string): PreviousSpeaker | undefined => {
    return speakers.find((speaker) => speaker.id === speakerId);
  },
);

export const selectRandomPreviousSpeakers = createSelector(
  selectPreviousSpeakers,
  selectViewport,
  (previousSpeakers: PreviousSpeaker[], viewport: Viewport): PreviousSpeaker[] => {
    const displayCount = viewport.isPhone ? 8 : 14;
    return randomOrder(previousSpeakers).slice(0, displayCount);
  },
);
