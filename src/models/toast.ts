import { Action } from './action';

export enum DURATION {
  FOREVER = 0,
  DEFAULT = 5000,
}

export interface Toast {
  action?: Action;
  duration?: DURATION;
  message: string;
}
