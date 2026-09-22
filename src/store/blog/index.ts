import { orderBy } from 'firebase/firestore';
import { RootState } from '..';
import { CollectionState, createCollectionSlice } from '../create-collection-slice';
import { Post } from '../../models/post';
import { subscribeToCollection } from '../../utils/firestore';

export type BlogState = CollectionState<Post>;

const { reducer, selectOrFetch } = createCollectionSlice<Post>('blog', (onStart, onNext, onError) =>
  subscribeToCollection('blog', onStart, onNext, onError, orderBy('published', 'desc')),
);

export const selectBlogPosts = (state: RootState): BlogState => selectOrFetch(state.blog);

export default reducer;
