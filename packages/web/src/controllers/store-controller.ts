import type { ReactiveController, ReactiveControllerHost } from 'lit';
import { type RootState, store } from '../store';

export interface StoreControllerOptions<T> {
  /** Decides whether two selected values are the same. Defaults to `Object.is`. */
  equals?: (a: T, b: T) => boolean;
  /** Called with the selected value on every connect and whenever the value changes. */
  onChange?: (value: T, previous: T) => void;
}

/**
 * Reactive controller that exposes a slice of the Redux state through `value` and only
 * requests a host update when the selected value changes.
 */
export class StoreController<T> implements ReactiveController {
  value: T;
  private unsubscribe: (() => void) | undefined;
  private readonly equals: (a: T, b: T) => boolean;
  private readonly onChange: ((value: T, previous: T) => void) | undefined;

  constructor(
    private readonly host: ReactiveControllerHost,
    private readonly selector: (state: RootState) => T,
    options: StoreControllerOptions<T> = {},
  ) {
    this.equals = options.equals ?? Object.is;
    this.onChange = options.onChange;
    this.value = selector(store.getState());
    host.addController(this);
  }

  hostConnected() {
    this.update(true);
    this.unsubscribe = store.subscribe(() => this.update(false));
  }

  hostDisconnected() {
    this.unsubscribe?.();
    this.unsubscribe = undefined;
  }

  private update(force: boolean) {
    const next = this.selector(store.getState());
    const changed = !this.equals(next, this.value);
    if (!changed && !force) {
      return;
    }
    const previous = this.value;
    this.value = next;
    this.onChange?.(next, previous);
    if (changed) {
      this.host.requestUpdate();
    }
  }
}
