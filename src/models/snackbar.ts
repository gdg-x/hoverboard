import { Action } from './action';

export enum TIMEOUT {
  FOREVER = -1,
  DEFAULT = 5000,
}

export interface Snackbar {
  action?: Action;
  id: number;
  label: string;
  timeout?: TIMEOUT;
}
