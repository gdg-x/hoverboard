import { Failure, Pending, Success } from '@abraham/remotedata';
import { BlogState, initialBlogState } from './state';
import {
  BlogAction,
  FETCH_BLOG_LIST,
  FETCH_BLOG_LIST_FAILURE,
  FETCH_BLOG_LIST_SUCCESS,
} from './types';

export const blogReducer = (state = initialBlogState, action: BlogAction): BlogState => {
  switch (action.type) {
    case FETCH_BLOG_LIST:
      return new Pending();

    case FETCH_BLOG_LIST_FAILURE:
      return new Failure(action.payload);

    case FETCH_BLOG_LIST_SUCCESS:
      return new Success(action.payload);

    default:
      return state;
  }
};
