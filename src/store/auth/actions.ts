import { FirebaseError } from 'firebase/app';
import {
  AuthError,
  fetchSignInMethodsForEmail,
  getAuth,
  linkWithCredential,
  OAuthCredential,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { store } from '..';
import { firebaseApp } from '../../firebase';
import { FirebaseUser } from '../../models/user';
import { logLogin } from '../../utils/analytics';
import { getFederatedProvider, getFederatedProviderClass, PROVIDER } from '../../utils/providers';
import { FeaturedSessionsActions, REMOVE_USER_FEATURED_SESSIONS } from '../featured-sessions/types';
import { unsubscribeFromFeedback } from '../feedback';
import { resetSubscribed } from '../subscribe/actions';
import { removeUser, setUser } from '../user/actions';
import {
  AUTH,
  AuthActions,
  AUTH_FAILURE,
  AUTH_SUCCESS,
  ExistingAccountError,
  UN_AUTH,
} from './types';

// TODO: show login prompt on my-schedule

const auth = getAuth(firebaseApp);

export const signIn = async (providerId: PROVIDER) => {
  store.dispatch<AuthActions>({ type: AUTH });
  const provider = getFederatedProvider(providerId);

  try {
    await signInWithPopup(auth, provider);
    store.dispatch<AuthActions>({ type: AUTH_SUCCESS, payload: true });
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
  const [providerId] = await fetchSignInMethodsForEmail(auth, error.customData.email!);
  const payload: ExistingAccountError = {
    code: error.code,
    credential,
    email: error.customData.email,
    providerId: providerId as PROVIDER,
  };
  store.dispatch<AuthActions>({ type: AUTH_FAILURE, payload });
};

export const mergeAccounts = async (providerId: PROVIDER, pendingCredential: OAuthCredential) => {
  const provider = getFederatedProvider(providerId);

  try {
    const { user } = await signInWithPopup(auth, provider);
    await linkWithCredential(user, pendingCredential);
    store.dispatch<AuthActions>({ type: AUTH_SUCCESS, payload: true });
  } catch (error) {
    if (error instanceof FirebaseError) {
      setAuthFailure(error as AuthError, providerId);
    } else {
      throw error;
    }
  }
};

export const onUser = () => {
  onAuthStateChanged(auth, (user: FirebaseUser | null) => {
    if (user) {
      setUser(user);
      logLogin();
    } else {
      unAuth();
      removeUser();
      resetSubscribed();
      store.dispatch(unsubscribeFromFeedback());
      store.dispatch<FeaturedSessionsActions>({ type: REMOVE_USER_FEATURED_SESSIONS });
    }
  });
};

const unAuth = () => store.dispatch<AuthActions>({ type: UN_AUTH });

export const signOut = () => firebaseSignOut(auth);
