import { Success } from '@abraham/remotedata';
import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '..';
import type { Filter } from '../../models/filter';
import { type FilterGroup, FilterGroupKey } from '../../models/filter-group';
import type { Session } from '../../models/session';
import type { BuiltSession } from '../../schedule/build-schedule';
import { selectSessionsState } from '../schedule';
import { selectRawSessionsState } from '.';

const buildFilter = (group: FilterGroupKey, tag: string): Filter => {
  return { group, tag };
};

const buildFilters = (sessions: Session[], filterGroupKey: FilterGroupKey): Filter[] => {
  const tags = new Set<string>();

  sessions.forEach((session) => {
    const value = session[filterGroupKey];
    if (value === undefined) {
      return;
    } else if (typeof value === 'string') {
      tags.add(value.trim());
    } else {
      value.map((tag) => tags.add(tag.trim()));
    }
  });

  return [...tags].map((value) => buildFilter(FilterGroupKey[filterGroupKey], value));
};

const selectSessionId = (_state: RootState, sessionId: string) => sessionId;

const selectSessions = (state: RootState): BuiltSession[] => {
  const sessions = selectSessionsState(state);
  return sessions instanceof Success ? sessions.data : [];
};

export const selectSession = createSelector(
  selectSessions,
  selectSessionId,
  (sessions: BuiltSession[], sessionId: string): BuiltSession | undefined => {
    return sessions.find((session) => session.id === sessionId);
  },
);

// Kept as a stable module-level reference (rather than a default parameter
// literal) so repeated calls with no explicit `groups` argument pass the
// same array instance, preserving `createSelector`'s memoization.
const DEFAULT_FILTER_GROUPS: FilterGroupKey[] = [FilterGroupKey.tags, FilterGroupKey.complexity];

const selectGroups = (_state: RootState, groups: FilterGroupKey[] = DEFAULT_FILTER_GROUPS) =>
  groups;

// The raw sessions have the same tags, and don't wait for the speakers.
const selectRawSessions = (state: RootState): Session[] => {
  const sessions = selectRawSessionsState(state);
  return sessions instanceof Success ? sessions.data : [];
};

export const selectFilterGroups = createSelector(
  selectRawSessions,
  selectGroups,
  (sessions: Session[], groups: FilterGroupKey[]): FilterGroup[] => {
    return [
      {
        key: FilterGroupKey.tags,
        filters: buildFilters(sessions, FilterGroupKey.tags),
      },
      {
        key: FilterGroupKey.complexity,
        filters: buildFilters(sessions, FilterGroupKey.complexity),
      },
    ].filter((filterGroup) => groups.includes(filterGroup.key));
  },
);
