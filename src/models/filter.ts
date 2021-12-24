import { FilterGroupKey } from './filter-group';

export interface Filter {
  group: FilterGroupKey;
  tag: string;
}
