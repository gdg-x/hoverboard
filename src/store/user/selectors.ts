import { RootState } from '..';

export const selectUserId = (state: RootState) => state.user.uid;
