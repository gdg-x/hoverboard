import { Filter } from './filter';

export enum FilterGroupKey {
  tags = 'tags',
  complexity = 'complexity',
}

export interface FilterGroup {
  title: string;
  key: FilterGroupKey;
  filters: Filter[];
}
