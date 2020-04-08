type Day = import('./day').Day;

export interface Schedule {
  [key: string]: Day;
}
