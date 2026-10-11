export interface Action {
  title: string;
  callback: () => void | Promise<void>;
}
