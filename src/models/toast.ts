// TODO: Move to file
interface Action {
  title: string;
  callback: () => void;
}

export interface Toast {
  action?: Action;
  duration?: number;
  message: string;
}
