import { Action } from './action';

export enum TIMEOUT {
  DEFAULT = 5000,
}

export interface Snackbar {
  action?: Action;
  id: number;
  label: string;
  timeout?: TIMEOUT;
}
