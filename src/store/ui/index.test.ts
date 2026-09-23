import { describe, expect, it, vi } from 'vitest';
import reducer, {
  closeVideoDialog,
  initialUiState,
  openVideoDialog,
  selectViewport,
  setHeroSettings,
  setViewportSize,
  VIEWPORT,
} from '.';
import { dispatch } from '../dispatch';
import { RootState } from '..';

vi.mock('../dispatch');

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

  it('replaces the hero settings', () => {
    const hero = {
      backgroundColor: '#fff',
      backgroundImage: '',
      fontColor: '#000',
      hideLogo: true,
    };
    const state = reducer(initialUiState, { type: 'ui/setHeroSettings', payload: hero });

    expect(state.heroSettings).toStrictEqual(hero);
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

describe('setHeroSettings', () => {
  it('dispatches a setHeroSettings action', () => {
    const hero = {
      backgroundColor: '#111',
      backgroundImage: 'img.png',
      fontColor: '#222',
      hideLogo: false,
    };
    setHeroSettings(hero);

    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'ui/setHeroSettings', payload: hero }),
    );
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
