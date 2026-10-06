import type { RootState } from '..';
import { type CollectionState, createCollectionSlice } from '../create-collection-slice';
import type { Post } from '../../models/post';
import { subscribeToBlog } from '../../db/blog';

export type BlogState = CollectionState<Post>;

const { reducer, selectOrFetch } = createCollectionSlice<Post>('blog', subscribeToBlog);

export const selectBlogPosts = (state: RootState): BlogState => selectOrFetch(state.blog);

export default reducer;
