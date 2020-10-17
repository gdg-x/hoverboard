import { Filter } from './filter';
import { Filterable } from './filterable';

export interface FilterSet {
  title: string;
  key: Filterable;
  items: Filter[];
}
