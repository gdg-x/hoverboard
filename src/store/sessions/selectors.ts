import { Success } from '@abraham/remotedata';
import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '..';
import { Filter } from '../../models/filter';
import { FilterGroup, FilterGroupKey } from '../../models/filter-group';
import { Session } from '../../models/session';
import { filters } from '../../utils/data';
import { selectSessionsState } from '.';

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

const selectSessions = (state: RootState) => {
  const sessions = selectSessionsState(state);
  return sessions instanceof Success ? sessions.data : [];
};

export const selectSession = createSelector(
  selectSessions,
  selectSessionId,
  (sessions: Session[], sessionId: string): Session | undefined => {
    return sessions.find((session) => session.id === sessionId);
  },
);

// Kept as a stable module-level reference (rather than a default parameter
// literal) so repeated calls with no explicit `groups` argument pass the
// same array instance, preserving `createSelector`'s memoization.
const DEFAULT_FILTER_GROUPS: FilterGroupKey[] = [FilterGroupKey.tags, FilterGroupKey.complexity];

const selectGroups = (_state: RootState, groups: FilterGroupKey[] = DEFAULT_FILTER_GROUPS) =>
  groups;

export const selectFilterGroups = createSelector(
  selectSessions,
  selectGroups,
  (sessions: Session[], groups: FilterGroupKey[]): FilterGroup[] => {
    return [
      {
        title: filters.tags,
        key: FilterGroupKey.tags,
        filters: buildFilters(sessions, FilterGroupKey.tags),
      },
      {
        title: filters.complexity,
        key: FilterGroupKey.complexity,
        filters: buildFilters(sessions, FilterGroupKey.complexity),
      },
    ].filter((filterGroup) => groups.includes(filterGroup.key));
  },
);
