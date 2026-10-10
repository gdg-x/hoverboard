import type { Filter } from './filter';

export enum FilterGroupKey {
  tags = 'tags',
  complexity = 'complexity',
  track = 'track',
}

export interface FilterGroup {
  key: FilterGroupKey;
  filters: Filter[];
}
