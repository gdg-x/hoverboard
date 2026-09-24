export interface DrawerOpenedChanged {
  value: boolean;
}

declare global {
  interface HTMLElementEventMap {
    'drawer-opened-changed': CustomEvent<DrawerOpenedChanged>;
  }
}
