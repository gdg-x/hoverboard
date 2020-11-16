import { Initialized, RemoteData } from '@abraham/remotedata';
import { Post } from '../../models/post';

export type BlogState = RemoteData<Error, Post[]>;
export const initialBlogState: BlogState = new Initialized();
