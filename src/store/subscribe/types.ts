export const SUBSCRIBE = 'SUBSCRIBE';

export type SubscribeState = boolean;

interface SubscribeAction {
  type: typeof SUBSCRIBE;
  subscribed: boolean;
}

export type SubscribeActionTypes = SubscribeAction;
