import { SUBSCRIBE, SubscribeActionTypes } from './types';
import { initialSubscribeState } from './state';

export const subscribeReducer = (state = initialSubscribeState, action: SubscribeActionTypes) => {
  switch (action.type) {
    case SUBSCRIBE:
      return action.subscribed;
    default:
      return state;
  }
};
