import { Initialized, RemoteData, Success } from '@abraham/remotedata';
import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '..';
import { Filter } from '../../models/filter';
import { FilterGroup, FilterGroupKey } from '../../models/filter-group';
import { Session } from '../../models/session';

export type SessionsState = RemoteData<Error, Session[]>;
export const initialSessionsState: SessionsState = new Initialized();

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

const selectSessions = (state: RootState) => {
  if (state.sessions instanceof Success) {
    return state.sessions.data;
  } else {
    return [];
  }
};

export const selectFiltersGroups = createSelector(selectSessions, (sessions): FilterGroup[] => {
  return [
    {
      title: '{$ filters.tags $}',
      key: FilterGroupKey.tags,
      filters: buildFilters(sessions, FilterGroupKey.tags),
    },
    {
      title: '{$ filters.complexity $}',
      key: FilterGroupKey.complexity,
      filters: buildFilters(sessions, FilterGroupKey.complexity),
    },
  ];
});
