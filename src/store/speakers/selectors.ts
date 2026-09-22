import { Success } from '@abraham/remotedata';
import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '..';
import { Filter } from '../../models/filter';
import { SpeakerWithTags } from '../../models/speaker';
import { selectFilters } from '../../store/filters/selectors';
import { generateClassName } from '../../utils/styles';
import { selectSpeakersState } from '.';

const selectSpeakerId = (_state: RootState, speakerId: string) => speakerId;

const selectSpeakers = (state: RootState): SpeakerWithTags[] => {
  const speakers = selectSpeakersState(state);
  return speakers instanceof Success ? speakers.data : [];
};

export const selectSpeaker = createSelector(
  selectSpeakers,
  selectSpeakerId,
  (speakers: SpeakerWithTags[], speakerId: string): SpeakerWithTags | undefined => {
    return speakers.find((speaker) => speaker.id === speakerId);
  },
);

export const selectFilteredSpeakers = createSelector(
  selectSpeakers,
  selectFilters,
  (speakers: SpeakerWithTags[], selectedFilters: Filter[]): SpeakerWithTags[] => {
    if (selectedFilters.length === 0) return speakers;

    return speakers.filter((speaker) => {
      return (speaker.tags || []).some((tag) => {
        const className = generateClassName(tag);
        return selectedFilters.some((filter) => filter.tag === className);
      });
    });
  },
);
