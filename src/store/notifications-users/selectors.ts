import { Initialized, Success } from '@abraham/remotedata';
import { RootState, store } from '..';
import { fetchNotificationsUsers } from './actions';

export const selectNotificationsUsersSubscribed = (state: RootState): boolean => {
  if (
    state.notificationPermission.kind === 'success' &&
    state.user instanceof Success &&
    state.notificationsUsers instanceof Initialized
  ) {
    store.dispatch(fetchNotificationsUsers(state.user.data.uid));
    return false;
  } else if (
    state.notificationPermission.kind === 'success' &&
    state.notificationsUsers instanceof Success
  ) {
    return state.notificationPermission.data in state.notificationsUsers.data.tokens;
  } else {
    return false;
  }
};
