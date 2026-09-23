import { describe, expect, it, vi } from 'vitest';
import { TIMEOUT } from '../../models/snackbar';

const loadModule = async () => import('.');

describe('snackbars', () => {
  it('starts with an empty queue', async () => {
    vi.resetModules();
    const { default: reducer } = await loadModule();

    expect(reducer(undefined, { type: '@@INIT' })).toStrictEqual([]);
  });

  it('queues simple snackbars with incrementing ids', async () => {
    vi.resetModules();
    const { default: reducer, queueSnackbar } = await loadModule();

    const first = reducer(undefined, queueSnackbar('Saved'));
    const second = reducer(first, queueSnackbar('Removed'));

    expect(second).toStrictEqual([
      { id: 0, label: 'Saved' },
      { id: 1, label: 'Removed' },
    ]);
  });

  it('queues complex snackbars with the generated id and provided fields', async () => {
    vi.resetModules();
    const { default: reducer, queueComplexSnackbar } = await loadModule();
    const callback = vi.fn();

    const state = reducer(
      undefined,
      queueComplexSnackbar({
        action: { title: 'Undo', callback },
        label: 'Bookmarked',
        timeout: TIMEOUT.DEFAULT,
      }),
    );

    expect(state).toStrictEqual([
      {
        id: 0,
        action: { title: 'Undo', callback },
        label: 'Bookmarked',
        timeout: TIMEOUT.DEFAULT,
      },
    ]);
  });

  it('removes the snackbar matching the provided id', async () => {
    vi.resetModules();
    const { default: reducer, queueSnackbar, removeSnackbar } = await loadModule();

    const queued = reducer(reducer(undefined, queueSnackbar('Saved')), queueSnackbar('Removed'));
    const state = reducer(queued, removeSnackbar(0));

    expect(state).toStrictEqual([{ id: 1, label: 'Removed' }]);
  });
});
