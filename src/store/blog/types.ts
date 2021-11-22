import { Post } from '../../models/post';

export const FETCH_BLOG_LIST = 'FETCH_BLOG_LIST';
export const FETCH_BLOG_LIST_FAILURE = 'FETCH_BLOG_LIST_FAILURE';
export const FETCH_BLOG_LIST_SUCCESS = 'FETCH_BLOG_LIST_SUCCESS';

interface FetchBlogListAction {
  type: typeof FETCH_BLOG_LIST;
}

interface FetchBlogListFailureAction {
  type: typeof FETCH_BLOG_LIST_FAILURE;
  payload: Error;
}

interface FetchBlogListSuccessAction {
  type: typeof FETCH_BLOG_LIST_SUCCESS;
  payload: Post[];
}

export type BlogActions =
  | FetchBlogListAction
  | FetchBlogListFailureAction
  | FetchBlogListSuccessAction;
