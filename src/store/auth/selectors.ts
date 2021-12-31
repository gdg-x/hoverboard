import { Failure } from '@abraham/remotedata';
import { AuthErrorCodes } from 'firebase/auth';
import { RootState } from '..';

const isMergeableError = (code: string) => {
  return code === AuthErrorCodes.NEED_CONFIRMATION || code === AuthErrorCodes.EMAIL_EXISTS;
};

export const selectAuthMergeable = (state: RootState) => {
  return state.auth instanceof Failure && isMergeableError(state.auth.error.code);
};
