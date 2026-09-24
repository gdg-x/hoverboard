export interface Stickied {
  sticked: boolean;
}

declare global {
  interface WindowEventMap {
    'element-sticked': CustomEvent<Stickied>;
  }
}
