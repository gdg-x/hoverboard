import { Failure, Initialized, Success } from '@abraham/remotedata';
import { describe, expect, it, vi } from 'vitest';
import reducer, {
  closeDialog,
  DIALOG,
  openFeedbackDialog,
  openSigninDialog,
  openSubscribeDialog,
  selectIsDialogOpen,
  setDialogError,
} from '.';
import { DialogForm } from '../../models/dialog-form';
import { Session } from '../../models/session';
import { dispatch } from '../dispatch';
import { RootState } from '..';

vi.mock('../dispatch');

const dialogForm: DialogForm = {
  firstFieldLabel: 'First name',
  secondFieldLabel: 'Email',
  submitLabel: 'Submit',
  title: 'Subscribe',
  submit: vi.fn(),
};

const session: Session = {
  id: 'session-1',
  description: 'A tour of Vitest',
  title: 'Testing in production',
};

describe('dialogs', () => {
  it('starts in the Initialized state', () => {
    expect(reducer(undefined, { type: '@@INIT' })).toStrictEqual(new Initialized());
  });

  it('stores opened dialogs as a Success', () => {
    expect(
      reducer(new Initialized(), {
        type: 'dialogs/open',
        payload: { name: DIALOG.SUBSCRIBE, data: dialogForm },
      }),
    ).toStrictEqual(new Success({ name: DIALOG.SUBSCRIBE, data: dialogForm }));
  });

  it('stores dialog errors as a Failure', () => {
    const error = new Error('boom');

    expect(reducer(new Initialized(), { type: 'dialogs/failure', payload: error })).toStrictEqual(
      new Failure(error),
    );
  });

  it('closes the dialog back to Initialized', () => {
    expect(
      reducer(new Success({ name: DIALOG.SIGNIN }), {
        type: 'dialogs/close',
      }),
    ).toStrictEqual(new Initialized());
  });
});

describe('dialog action helpers', () => {
  it('dispatches close when closing a dialog', () => {
    closeDialog();

    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'dialogs/close' }));
  });

  it('dispatches failure when setting a dialog error', () => {
    const error = new Error('invalid');

    setDialogError(error);

    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'dialogs/failure',
        payload: error,
      }),
    );
  });

  it('dispatches the sign-in dialog payload', () => {
    openSigninDialog();

    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'dialogs/open',
        payload: { name: DIALOG.SIGNIN },
      }),
    );
  });

  it('dispatches the subscribe dialog payload', () => {
    openSubscribeDialog(dialogForm);

    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'dialogs/open',
        payload: { name: DIALOG.SUBSCRIBE, data: dialogForm },
      }),
    );
  });

  it('dispatches the feedback dialog payload', () => {
    openFeedbackDialog(session);

    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'dialogs/open',
        payload: { name: DIALOG.FEEDBACK, data: session },
      }),
    );
  });
});

describe('selectIsDialogOpen', () => {
  it('returns true for the matching open dialog', () => {
    const state = {
      dialogs: new Success({ name: DIALOG.FEEDBACK, data: session }),
    } as unknown as RootState;

    expect(selectIsDialogOpen(state, DIALOG.FEEDBACK)).toBe(true);
  });

  it('returns false when a different dialog is open or state is not loaded', () => {
    const successState = {
      dialogs: new Success({ name: DIALOG.SIGNIN }),
    } as unknown as RootState;
    const initializedState = {
      dialogs: new Initialized(),
    } as unknown as RootState;

    expect(selectIsDialogOpen(successState, DIALOG.FEEDBACK)).toBe(false);
    expect(selectIsDialogOpen(initializedState, DIALOG.SIGNIN)).toBe(false);
  });
});
