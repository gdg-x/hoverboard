import firebase from 'firebase';
import { FirebaseError } from 'firebase';

export const FETCH_BLOG_LIST = 'FETCH_BLOG_LIST';
export const FETCH_BLOG_LIST_FAILURE = 'FETCH_BLOG_LIST_FAILURE';
export const FETCH_BLOG_LIST_SUCCESS = 'FETCH_BLOG_LIST_SUCCESS';

export type BlogPostData = firebase.firestore.DocumentData & { id: string };

export interface BlogState {
  fetching: boolean;
  fetchingError?: FirebaseError;
  list?: BlogPostData[];
  obj?: {
    [id: string]: BlogPostData;
  };
}

interface FetchBlogListAction {
  type: typeof FETCH_BLOG_LIST;
}

interface FetchBlogListFailureAction {
  type: typeof FETCH_BLOG_LIST_FAILURE;
  payload: {
    error: FirebaseError;
  };
}

interface FetchBlogListSuccessAction {
  type: typeof FETCH_BLOG_LIST_SUCCESS;
  payload: {
    list: BlogPostData[];
    obj: {
      [id: string]: BlogPostData;
    };
  };
}

export type BlogActionTypes =
  | FetchBlogListAction
  | FetchBlogListFailureAction
  | FetchBlogListSuccessAction;
