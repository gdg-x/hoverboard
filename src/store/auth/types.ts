import { RemoteData } from '@abraham/remotedata';
import { OAuthCredential } from 'firebase/auth';
import { PROVIDER } from '../../utils/providers';

export const AUTH = 'AUTH';
export const AUTH_SUCCESS = 'AUTH_SUCCESS';
export const AUTH_FAILURE = 'AUTH_FAILURE';
export const UN_AUTH = 'UN_AUTH';

export type ExistingAccountError = {
  code: string;
  credential: OAuthCredential | null;
  email: string | undefined;
  providerId: PROVIDER | undefined;
};

export type AuthState = RemoteData<ExistingAccountError, true>;

interface AuthAction {
  type: typeof AUTH;
}

interface AuthSuccessAction {
  type: typeof AUTH_SUCCESS;
  payload: true;
}

interface AuthFailureAction {
  type: typeof AUTH_FAILURE;
  payload: ExistingAccountError;
}

interface UnAuthAction {
  type: typeof UN_AUTH;
}

export type AuthActions = AuthAction | AuthSuccessAction | AuthFailureAction | UnAuthAction;
