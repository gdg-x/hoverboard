import { Action } from './action';

export interface Toast {
  action?: Action;
  duration?: number;
  message: string;
}
