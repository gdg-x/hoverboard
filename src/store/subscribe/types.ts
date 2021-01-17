export const SUBSCRIBE = 'SUBSCRIBE';
export const SUBSCRIBE_SUCCESS = 'SUBSCRIBE_SUCCESS';
export const SUBSCRIBE_FAILURE = 'SUBSCRIBE_FAILURE';
export const SUBSCRIBE_RESET = 'SUBSCRIBE_RESET';

interface SubscribeAction {
  type: typeof SUBSCRIBE;
}

interface SubscribeSuccessAction {
  type: typeof SUBSCRIBE_SUCCESS;
}

interface SubscribeFailureAction {
  type: typeof SUBSCRIBE_FAILURE;
  payload: Error;
}

interface SubscribeResetAction {
  type: typeof SUBSCRIBE_RESET;
}

export type SubscribeActions =
  | SubscribeAction
  | SubscribeSuccessAction
  | SubscribeFailureAction
  | SubscribeResetAction;
