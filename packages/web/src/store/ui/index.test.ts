import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import reducer, {
  closeVideoDialog,
  initialUiState,
  LOCAL_TIME_KEY,
  loadLocalTime,
  openVideoDialog,
  selectViewport,
  setLocalTime,
  setViewportSize,
  VIEWPORT,
} from '.';
import { dispatch } from '../dispatch';
import type { RootState } from '..';

const config = vi.hoisted(() => ({ attendance: 'inPerson' }));

vi.mock('../dispatch');
vi.mock('../../config/site', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../config/site')>()),
  get attendance() {
    return config.attendance;
  },
}));

describe('ui', () => {
  it('starts with the default hero, viewport, and video dialog state', () => {
    expect(reducer(undefined, { type: '@@INIT' })).toStrictEqual(initialUiState);
  });

  it('updates the requested viewport size', () => {
    const action = {
      type: 'ui/setViewportSize',
      payload: { size: VIEWPORT.isPhone, matches: false },
    };
    const state = reducer(initialUiState, action);

    expect(state.viewport.isPhone).toBe(false);
  });

  it('starts in the event time zone', () => {
    expect(initialUiState.localTime).toBe(false);
  });

  it('sets the local time choice', () => {
    const state = reducer(initialUiState, { type: 'ui/setLocalTime', payload: true });

    expect(state.localTime).toBe(true);
  });

  it('opens and closes the video dialog', () => {
    const opened = reducer(initialUiState, {
      type: 'ui/toggleVideoDialog',
      payload: { open: true, youtubeId: 'abc', title: 'Title' },
    });
    expect(opened.videoDialog).toStrictEqual({ open: true, youtubeId: 'abc', title: 'Title' });

    const closed = reducer(opened, {
      type: 'ui/toggleVideoDialog',
      payload: { open: false, youtubeId: '', title: '' },
    });
    expect(closed.videoDialog.open).toBe(false);
  });
});

describe('setViewportSize', () => {
  it('dispatches a setViewportSize action', () => {
    setViewportSize({ size: VIEWPORT.isTabletPlus, matches: true });

    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'ui/setViewportSize',
        payload: { size: VIEWPORT.isTabletPlus, matches: true },
      }),
    );
  });
});

describe('setLocalTime', () => {
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('dispatches the choice and stores it', () => {
    setLocalTime(true);

    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'ui/setLocalTime', payload: true }),
    );
    expect(localStorage.getItem(LOCAL_TIME_KEY)).toBe('true');

    setLocalTime(false);

    expect(localStorage.getItem(LOCAL_TIME_KEY)).toBe('false');
  });

  it('still dispatches when storage throws', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('private mode');
    });

    expect(() => setLocalTime(true)).not.toThrow();
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'ui/setLocalTime', payload: true }),
    );
  });
});

describe('loadLocalTime', () => {
  afterEach(() => {
    localStorage.clear();
    vi.mocked(dispatch).mockClear();
  });

  it('applies a stored choice', () => {
    localStorage.setItem(LOCAL_TIME_KEY, 'true');

    loadLocalTime();

    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'ui/setLocalTime', payload: true }),
    );
  });

  it('does nothing without one', () => {
    loadLocalTime();

    expect(dispatch).not.toHaveBeenCalled();
  });

  describe('for an online event', () => {
    beforeEach(() => {
      config.attendance = 'online';
    });

    afterEach(() => {
      config.attendance = 'inPerson';
    });

    it("uses the visitor's time zone without a stored choice", () => {
      loadLocalTime();

      expect(dispatch).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'ui/setLocalTime', payload: true }),
      );
    });

    it("keeps the event's time zone when the visitor chose it", () => {
      localStorage.setItem(LOCAL_TIME_KEY, 'false');

      loadLocalTime();

      expect(dispatch).not.toHaveBeenCalled();
    });
  });
});

describe('closeVideoDialog', () => {
  it('dispatches a toggleVideoDialog action with open set to false', () => {
    closeVideoDialog();

    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'ui/toggleVideoDialog',
        payload: { open: false, youtubeId: '', title: '' },
      }),
    );
  });
});

describe('openVideoDialog', () => {
  it('dispatches a toggleVideoDialog action with open set to true', () => {
    openVideoDialog({ youtubeId: 'xyz', title: 'A talk' });

    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'ui/toggleVideoDialog',
        payload: { open: true, youtubeId: 'xyz', title: 'A talk' },
      }),
    );
  });
});

describe('selectViewport', () => {
  it('returns the viewport slice of state', () => {
    const state = { ui: initialUiState } as unknown as RootState;

    expect(selectViewport(state)).toStrictEqual(initialUiState.viewport);
  });
});
