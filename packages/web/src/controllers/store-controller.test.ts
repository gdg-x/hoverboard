import { describe, expect, it, vi } from 'vitest';
import type { ReactiveControllerHost } from 'lit';
import { store } from '../store';
import { queueSnackbar, removeSnackbar } from '../store/snackbars';
import { StoreController } from './store-controller';

const createHost = () =>
  ({
    addController: vi.fn(),
    removeController: vi.fn(),
    requestUpdate: vi.fn(),
    updateComplete: Promise.resolve(true),
  }) satisfies ReactiveControllerHost;

describe('StoreController', () => {
  it('registers itself with the host and selects the initial value', () => {
    const host = createHost();

    const controller = new StoreController(host, (state) => state.snackbars.length);

    expect(host.addController).toHaveBeenCalledWith(controller);
    expect(controller.value).toBe(store.getState().snackbars.length);
  });

  it('requests an update only when the selected value changes', () => {
    const host = createHost();
    const controller = new StoreController(host, (state) => state.snackbars.length > 0);
    controller.hostConnected();

    store.dispatch(queueSnackbar('one'));
    expect(controller.value).toBe(true);
    expect(host.requestUpdate).toHaveBeenCalledTimes(1);

    store.dispatch(queueSnackbar('two'));
    expect(host.requestUpdate).toHaveBeenCalledTimes(1);

    store
      .getState()
      .snackbars.map((snackbar) => snackbar.id)
      .forEach((id) => {
        store.dispatch(removeSnackbar(id));
      });
    expect(controller.value).toBe(false);
    expect(host.requestUpdate).toHaveBeenCalledTimes(2);

    controller.hostDisconnected();
  });

  it('calls onChange on connect and when the selected value changes', () => {
    const host = createHost();
    const onChange = vi.fn();
    const controller = new StoreController(host, (state) => state.snackbars.length, { onChange });

    controller.hostConnected();
    expect(onChange).toHaveBeenCalledWith(store.getState().snackbars.length, expect.anything());
    expect(host.requestUpdate).not.toHaveBeenCalled();

    store.dispatch(queueSnackbar('changed'));
    expect(onChange).toHaveBeenLastCalledWith(store.getState().snackbars.length, 0);
    expect(host.requestUpdate).toHaveBeenCalledTimes(1);

    controller.hostDisconnected();
    store.dispatch(removeSnackbar(store.getState().snackbars[0]!.id));
  });

  it('stops listening when the host disconnects', () => {
    const host = createHost();
    const controller = new StoreController(host, (state) => state.snackbars.length);
    controller.hostConnected();
    controller.hostDisconnected();

    store.dispatch(queueSnackbar('ignored'));

    expect(host.requestUpdate).not.toHaveBeenCalled();
    store.dispatch(removeSnackbar(store.getState().snackbars[0]!.id));
  });
});
