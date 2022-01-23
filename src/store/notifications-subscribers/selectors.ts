import { Initialized, Pending } from '@abraham/remotedata';
import { RootState, store } from '..';
import { fetchNotificationsSubscribers } from './actions';
import { NotificationsSubscribersState } from './state';

export const selectNotificationsSubscribers = (state: RootState): NotificationsSubscribersState => {
  if (
    state.notificationPermission.kind === 'success' &&
    state.notificationsSubscribers instanceof Initialized
  ) {
    store.dispatch(fetchNotificationsSubscribers(state.notificationPermission.data));
    return new Pending();
  } else {
    return state.notificationsSubscribers;
  }
};
