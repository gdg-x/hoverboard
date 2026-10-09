import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent } from '@testing-library/dom';
import { html } from 'lit';
import { fixture } from '../../../__tests__/helpers/fixtures';
import { store } from '../../store';
import { TIMEOUT } from '../../models/snackbar';
import { queueComplexSnackbar, queueSnackbar, removeSnackbar } from '../../store/snackbars';
import type { SnackBar } from './snack-bar';
import './snack-bar';

vi.mock('../../store/snackbars', async (importOriginal) => ({
  __esModule: true,
  ...(await importOriginal<typeof import('../../store/snackbars')>()),
  removeSnackbar: vi.fn((id: number) => ({ type: 'snackbars/removeSnackbar', payload: id })),
}));

const mockRemoveSnackbar = vi.mocked(removeSnackbar);

describe('snack-bar', () => {
  afterEach(() => {
    mockRemoveSnackbar.mockClear();
    // Drain any snackbars queued by a test so state doesn't leak.
    while (store.getState().snackbars.length > 0) {
      store.dispatch({
        type: 'snackbars/removeSnackbar',
        payload: store.getState().snackbars[0]!.id,
      });
    }
  });

  it('defines a component', () => {
    expect(customElements.get('snack-bar')).toBeDefined();
  });

  it('renders the label of the first queued snackbar', async () => {
    const { element, shadowRoot } = await fixture<SnackBar>(html`<snack-bar></snack-bar>`);
    const toast = shadowRoot.querySelector('hb-toast');

    expect(toast).not.toHaveAttribute('open');

    store.dispatch(queueSnackbar('Saved successfully'));
    await element.updateComplete;

    expect(shadowRoot.querySelector('.label')).toHaveTextContent('Saved successfully');
    expect(toast).toHaveAttribute('open');
  });

  it('renders an action button for complex snackbars', async () => {
    const callback = vi.fn();
    const { element, shadowRoot } = await fixture<SnackBar>(html`<snack-bar></snack-bar>`);
    store.dispatch(queueComplexSnackbar({ label: 'Updated', action: { title: 'Undo', callback } }));
    await element.updateComplete;

    const actionButton = shadowRoot.querySelector('.action')!;
    expect(actionButton).toHaveTextContent('Undo');

    fireEvent.click(actionButton);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(mockRemoveSnackbar).toHaveBeenCalledTimes(1);
  });

  it('dispatches removeSnackbar when the dismiss button is clicked', async () => {
    const { element, shadowRoot } = await fixture<SnackBar>(html`<snack-bar></snack-bar>`);
    store.dispatch(queueSnackbar('Dismiss me'));
    await element.updateComplete;
    const { id } = store.getState().snackbars[0]!;

    fireEvent.click(shadowRoot.querySelector('.dismiss')!);

    expect(mockRemoveSnackbar).toHaveBeenCalledWith(id);
  });

  it('dispatches removeSnackbar when the timeout elapses', async () => {
    vi.useFakeTimers();
    const { element } = await fixture<SnackBar>(html`<snack-bar></snack-bar>`);
    store.dispatch(queueSnackbar('Auto dismiss'));
    await element.updateComplete;
    const { id } = store.getState().snackbars[0]!;

    vi.advanceTimersByTime(TIMEOUT.DEFAULT - 1);
    expect(mockRemoveSnackbar).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    vi.useRealTimers();

    expect(mockRemoveSnackbar).toHaveBeenCalledWith(id);
  });
});
