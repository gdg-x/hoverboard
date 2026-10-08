import type { Filter } from './filter';

export enum FilterGroupKey {
  tags = 'tags',
  complexity = 'complexity',
}

export interface FilterGroup {
  key: FilterGroupKey;
  filters: Filter[];
}
