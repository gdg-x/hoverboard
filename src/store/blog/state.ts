import { BlogState } from './types';

export const initialBlogState: BlogState = {
  fetching: false,
  fetchingError: null,
  list: [],
  obj: {},
};
