import type { ReactiveElement } from 'lit';
import type { RootState } from '../store';
import { StoreController } from './store-controller';

/**
 * Binds a property to a slice of the Redux state. The property is read-only in practice (it
 * follows the store), and the host updates only when the selected value changes. `selector`
 * also receives the host so it can depend on the element's own properties.
 *
 * ```ts
 * @fromStore((state) => state.user)
 * private user!: UserState;
 * ```
 */
export const fromStore =
  <T, H = ReactiveElement>(
    selector: (state: RootState, host: H) => T,
    options: { equals?: (a: T, b: T) => boolean } = {},
  ) =>
  (prototype: ReactiveElement, name: string) => {
    const controllers = new WeakMap<ReactiveElement, StoreController<T>>();

    (prototype.constructor as typeof ReactiveElement).addInitializer((host) => {
      controllers.set(
        host,
        new StoreController(host, (state) => selector(state, host as unknown as H), {
          ...options,
          onChange: (_value, previous) => host.requestUpdate(name, previous),
        }),
      );
    });

    Object.defineProperty(prototype, name, {
      configurable: true,
      enumerable: true,
      get(this: ReactiveElement) {
        return controllers.get(this)?.value;
      },
      // Lets tests and callers override the value until the store next changes it.
      set(this: ReactiveElement, value: T) {
        const controller = controllers.get(this);
        if (controller) {
          const previous = controller.value;
          controller.value = value;
          this.requestUpdate(name, previous);
        }
      },
    });
  };
