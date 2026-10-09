import { Success } from '@abraham/remotedata';
import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '..';
import type { Filter } from '../../models/filter';
import type { BuiltSpeaker } from '../../schedule/build-schedule';
import { selectFilters } from '../filters';
import { generateClassName } from '../../utils/styles';
import { selectSpeakersState } from '../schedule';

const selectSpeakerId = (_state: RootState, speakerId: string) => speakerId;

const selectSpeakers = (state: RootState): BuiltSpeaker[] => {
  const speakers = selectSpeakersState(state);
  return speakers instanceof Success ? speakers.data : [];
};

export const selectSpeaker = createSelector(
  selectSpeakers,
  selectSpeakerId,
  (speakers: BuiltSpeaker[], speakerId: string): BuiltSpeaker | undefined => {
    return speakers.find((speaker) => speaker.id === speakerId);
  },
);

export const selectFilteredSpeakers = createSelector(
  selectSpeakers,
  selectFilters,
  (speakers: BuiltSpeaker[], selectedFilters: Filter[]): BuiltSpeaker[] => {
    if (selectedFilters.length === 0) return speakers;

    return speakers.filter((speaker) => {
      return (speaker.tags || []).some((tag) => {
        const className = generateClassName(tag);
        return selectedFilters.some((filter) => filter.tag === className);
      });
    });
  },
);
