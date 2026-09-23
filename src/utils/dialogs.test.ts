import { Failure, Initialized, Success } from '@abraham/remotedata';
import { describe, expect, it } from 'vitest';
import { DIALOG, DialogState } from '../store/dialogs';
import { isDialogOpen } from './dialogs';

describe('isDialogOpen', () => {
  it('returns true when the matching dialog is open', () => {
    const dialog: DialogState = new Success({ name: DIALOG.SIGNIN });

    expect(isDialogOpen(dialog, DIALOG.SIGNIN)).toBe(true);
  });

  it('returns false when a different dialog is open', () => {
    const dialog: DialogState = new Success({ name: DIALOG.SIGNIN });

    expect(isDialogOpen(dialog, DIALOG.SUBSCRIBE)).toBe(false);
  });

  it('returns false when no dialog is open', () => {
    const dialog: DialogState = new Initialized();

    expect(isDialogOpen(dialog, DIALOG.SIGNIN)).toBe(false);
  });

  it('returns false when the dialog is in a failure state', () => {
    const dialog: DialogState = new Failure(new Error('nope'));

    expect(isDialogOpen(dialog, DIALOG.SIGNIN)).toBe(false);
  });
});
