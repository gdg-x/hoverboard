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
 * private accessor user!: UserState;
 * ```
 */
export const fromStore =
  <T, H extends ReactiveElement = ReactiveElement>(
    selector: (state: RootState, host: H) => T,
    options: { equals?: (a: T, b: T) => boolean } = {},
  ) =>
  (
    _target: ClassAccessorDecoratorTarget<H, T>,
    context: ClassAccessorDecoratorContext<H, T>,
  ): ClassAccessorDecoratorResult<H, T> => {
    const name = String(context.name);
    const controllers = new WeakMap<ReactiveElement, StoreController<T>>();

    context.addInitializer(function (this: H) {
      controllers.set(
        this,
        new StoreController(this, (state) => selector(state, this), {
          ...options,
          onChange: (_value, previous) => this.requestUpdate(name, previous),
        }),
      );
    });

    return {
      get(this: H) {
        return controllers.get(this)?.value as T;
      },
      // Lets tests and callers override the value until the store next changes it.
      set(this: H, value: T) {
        const controller = controllers.get(this);
        if (controller) {
          const previous = controller.value;
          controller.value = value;
          this.requestUpdate(name, previous);
        }
      },
    };
  };
