import {
  SUBSCRIBE,
  SubscribeActions,
  SUBSCRIBE_FAILURE,
  SUBSCRIBE_RESET,
  SUBSCRIBE_SUCCESS,
} from './types';
import { initialSubscribeState, SubscribeState } from './state';
import { Failure, Initialized, Pending, Success } from '@abraham/remotedata';

export const subscribeReducer = (
  state = initialSubscribeState,
  action: SubscribeActions
): SubscribeState => {
  switch (action.type) {
    case SUBSCRIBE:
      return new Pending();

    case SUBSCRIBE_SUCCESS:
      return new Success(true);

    case SUBSCRIBE_FAILURE:
      return new Failure(action.payload);

    case SUBSCRIBE_RESET:
      return new Initialized();

    default:
      return state;
  }
};
