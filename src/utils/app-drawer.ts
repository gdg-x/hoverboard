export interface OpenedChanged {
  value: boolean;
}

declare global {
  interface HTMLElementEventMap {
    'opened-changed': CustomEvent<OpenedChanged>;
  }
}
