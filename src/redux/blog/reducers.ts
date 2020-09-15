import { initialBlogState } from './state';
import {
  BlogActionTypes,
  BlogState,
  FETCH_BLOG_LIST,
  FETCH_BLOG_LIST_FAILURE,
  FETCH_BLOG_LIST_SUCCESS,
} from './types';

export const blogReducer = (state = initialBlogState, action: BlogActionTypes): BlogState => {
  switch (action.type) {
    case FETCH_BLOG_LIST:
      return {
        ...state,
        ...{
          fetching: true,
          fetchingError: null,
          list: [],
          obj: {},
        },
      };

    case FETCH_BLOG_LIST_FAILURE:
      return {
        ...state,
        ...{
          fetching: false,
          fetchingError: action.payload.error,
        },
      };

    case FETCH_BLOG_LIST_SUCCESS:
      return {
        ...state,
        ...{
          fetching: false,
          list: action.payload.list,
          obj: action.payload.obj,
        },
      };

    default:
      return state;
  }
};
