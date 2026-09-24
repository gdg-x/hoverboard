import { Failure, Initialized, Pending, RemoteData, Success } from '@abraham/remotedata';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { FirebaseError } from 'firebase/app';
import {
  AuthError,
  AuthErrorCodes,
  fetchSignInMethodsForEmail,
  getAuth,
  linkWithCredential,
  OAuthCredential,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { RootState } from '..';
import { firebaseApp } from '../../firebase';
import { FirebaseUser } from '../../models/user';
import { logLogin } from '../../utils/analytics';
import { getFederatedProvider, getFederatedProviderClass, PROVIDER } from '../../utils/providers';
import { dispatch } from '../dispatch';
import { resetFeaturedSessions } from '../featured-sessions';
import { unsubscribeFromFeedback } from '../feedback';
import { resetSubscribed } from '../subscribe';
import { removeUser, setUser } from '../user';

export type ExistingAccountError = {
  code: string;
  credential: OAuthCredential | null;
  email: string | undefined;
  providerId: PROVIDER | undefined;
};

export type AuthState = RemoteData<ExistingAccountError, true>;

export const initialAuthState: AuthState = new Initialized();
const initialState = initialAuthState;

const slice = createSlice({
  name: 'auth',
  initialState: initialState as AuthState,
  reducers: {
    pending: (): AuthState => new Pending(),
    success: (): AuthState => new Success(true),
    failure: (_state, action: PayloadAction<ExistingAccountError>): AuthState =>
      new Failure(action.payload),
    unAuth: (): AuthState => new Initialized(),
  },
});

const { pending, success, failure, unAuth } = slice.actions;

const isMergeableError = (code: string) => {
  return code === AuthErrorCodes.NEED_CONFIRMATION || code === AuthErrorCodes.EMAIL_EXISTS;
};

export const selectAuthMergeable = (state: RootState) => {
  return state.auth instanceof Failure && isMergeableError(state.auth.error.code);
};

let cachedAuth: ReturnType<typeof getAuth> | undefined;
const getFirebaseAuth = () => {
  if (!cachedAuth) {
    cachedAuth = getAuth(firebaseApp);
  }
  return cachedAuth;
};

export const signIn = async (providerId: PROVIDER) => {
  dispatch(pending());
  const provider = getFederatedProvider(providerId);

  try {
    await signInWithPopup(getFirebaseAuth(), provider);
    dispatch(success());
  } catch (error) {
    if (error instanceof FirebaseError) {
      setAuthFailure(error as AuthError, providerId);
    } else {
      throw error;
    }
  }
};

const setAuthFailure = async (error: AuthError, credentialProviderId: PROVIDER) => {
  const credential = getFederatedProviderClass(credentialProviderId).credentialFromError(error);
  const [providerId] = await fetchSignInMethodsForEmail(getFirebaseAuth(), error.customData.email!);
  const payload: ExistingAccountError = {
    code: error.code,
    credential,
    email: error.customData.email,
    providerId: providerId as PROVIDER,
  };
  dispatch(failure(payload));
};

export const mergeAccounts = async (providerId: PROVIDER, pendingCredential: OAuthCredential) => {
  const provider = getFederatedProvider(providerId);

  try {
    const { user } = await signInWithPopup(getFirebaseAuth(), provider);
    await linkWithCredential(user, pendingCredential);
    dispatch(success());
  } catch (error) {
    if (error instanceof FirebaseError) {
      setAuthFailure(error as AuthError, providerId);
    } else {
      throw error;
    }
  }
};

export const onUser = () => {
  onAuthStateChanged(getFirebaseAuth(), (user: FirebaseUser | null) => {
    if (user) {
      setUser(user);
      logLogin();
    } else {
      dispatch(unAuth());
      removeUser();
      resetSubscribed();
      dispatch(unsubscribeFromFeedback());
      resetFeaturedSessions();
    }
  });
};

export const signOut = () => firebaseSignOut(getFirebaseAuth());

export default slice.reducer;
