import { Initialized, Pending, Success } from '@abraham/remotedata';
import { RootState, store } from '..';
import { fetchNotificationsSubscribers } from './actions';
import { NotificationsSubscribersState } from './state';

export const selectNotificationsSubscribers = (state: RootState): NotificationsSubscribersState => {
  if (
    state.notificationPermission.value instanceof Success &&
    state.notificationsSubscribers instanceof Initialized
  ) {
    store.dispatch(fetchNotificationsSubscribers(state.notificationPermission.value.data));
    return new Pending();
  } else {
    return state.notificationsSubscribers;
  }
};
