import { Initialized, Success } from '@abraham/remotedata';
import { createSelector } from '@reduxjs/toolkit';
import { RootState, store } from '..';
import { Filter } from '../../models/filter';
import { FilterGroup, FilterGroupKey } from '../../models/filter-group';
import { Session } from '../../models/session';
import { filters } from '../../utils/data';
import { fetchSessions } from './actions';

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
  if (state.sessions instanceof Success) {
    return state.sessions.data;
  } else if (state.sessions instanceof Initialized) {
    store.dispatch(fetchSessions);
  }
  return [];
};

export const selectSession = createSelector(
  selectSessions,
  selectSessionId,
  (sessions: Session[], sessionId: string): Session | undefined => {
    return sessions.find((session) => session.id === sessionId);
  }
);

const selectGroups = (
  _state: RootState,
  groups: FilterGroupKey[] = [FilterGroupKey.tags, FilterGroupKey.complexity]
) => groups;

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
  }
);
