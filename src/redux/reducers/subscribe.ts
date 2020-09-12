import { SUBSCRIBE } from '../constants';
import { initialState } from '../initial-state';

export const subscribeReducer = (state = initialState.subscribed, action) => {
  switch (action.type) {
    case SUBSCRIBE:
      return action.subscribed;
    default:
      return state;
  }
};
