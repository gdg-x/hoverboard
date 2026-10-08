import { Success } from '@abraham/remotedata';
import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '..';
import type { PreviousSpeaker } from '../../models/previous-speaker';
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
