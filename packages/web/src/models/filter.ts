import { FilterGroupKey } from './filter-group';

export interface Filter {
  group: FilterGroupKey;
  tag: string;
  /** What the chip shows, when it isn't the tag, such as a track's title for its ID. */
  label?: string;
}
