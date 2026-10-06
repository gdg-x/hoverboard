import { ReactiveController, ReactiveControllerHost } from 'lit';
import { RootState, store } from '../store';

/**
 * Reactive controller that exposes a slice of the Redux state through `value` and only
 * requests a host update when the selected value changes.
 */
export class StoreController<T> implements ReactiveController {
  value: T;
  private unsubscribe: (() => void) | undefined;

  constructor(
    private readonly host: ReactiveControllerHost,
    private readonly selector: (state: RootState) => T,
    private readonly equals: (a: T, b: T) => boolean = Object.is,
  ) {
    this.value = selector(store.getState());
    host.addController(this);
  }

  hostConnected() {
    this.update();
    this.unsubscribe = store.subscribe(() => this.update());
  }

  hostDisconnected() {
    this.unsubscribe?.();
    this.unsubscribe = undefined;
  }

  private update() {
    const next = this.selector(store.getState());
    if (this.equals(next, this.value)) {
      return;
    }
    this.value = next;
    this.host.requestUpdate();
  }
}
