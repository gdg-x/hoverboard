import { Failure, Initialized, Pending, type RemoteData, Success } from '@abraham/remotedata';
import { msg } from '@lit/localize';
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { FirebaseError } from 'firebase/app';
import {
  type AuthError,
  AuthErrorCodes,
  connectAuthEmulator,
  fetchSignInMethodsForEmail,
  getAuth,
  isSignInWithEmailLink,
  linkWithCredential,
  OAuthCredential,
  onAuthStateChanged,
  sendSignInLinkToEmail,
  signInWithEmailLink,
  signInWithPopup,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { clearIndexedDbPersistence, terminate } from 'firebase/firestore';
import type { RootState } from '..';
import { db, firebaseApp, isDemoProject } from '../../firebase';
import type { FirebaseUser } from '../../models/user';
import { logLogin } from '../../utils/analytics';
import { getFederatedProvider, getFederatedProviderClass, PROVIDER } from '../../utils/providers';
import { dispatch } from '../dispatch';
import { resetFeaturedSessions } from '../featured-sessions';
import { resetPending } from '../sync';
import { unsubscribeFromFeedback } from '../feedback';
import { queueSnackbar } from '../snackbars';
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
    if (isDemoProject) {
      connectAuthEmulator(cachedAuth, 'http://127.0.0.1:9099', { disableWarnings: true });
    }
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
      resetPending();
    }
  });
};

/**
 * Signs out and deletes Firestore's offline cache, which holds the user's documents, so the next
 * person on this browser can't read them. Firestore can't be used after that, so the page reloads.
 */
export const signOut = async () => {
  await firebaseSignOut(getFirebaseAuth());
  await terminate(db);
  try {
    await clearIndexedDbPersistence(db);
  } catch {
    // Another tab still has the cache open.
  }
  window.location.reload();
};

// The address the link went to, so the visitor needn't type it again on the same browser.
const SIGN_IN_EMAIL_KEY = 'hb-sign-in-email';
// Firebase adds these to the page's URL in the sign-in link.
const SIGN_IN_LINK_PARAMS = ['apiKey', 'oobCode', 'mode', 'continueUrl', 'lang', 'tenantId'];

let signInLink: string | undefined;

const storage = () => localStorage;

/** Emails a sign-in link that comes back to the current page. */
export const sendSignInLink = async (email: string) => {
  const url = new URL(window.location.href);
  url.hash = '';
  await sendSignInLinkToEmail(getFirebaseAuth(), email, {
    url: url.toString(),
    handleCodeInApp: true,
  });
  try {
    storage().setItem(SIGN_IN_EMAIL_KEY, email);
  } catch {
    // Without storage, the visitor types the address again when they open the link.
  }
};

/**
 * Takes a sign-in link out of the page's URL, so it is not shared, bookmarked or used twice, and
 * keeps it to finish signing in. Returns whether the page was opened from one.
 */
export const takeSignInLink = (): boolean => {
  const href = window.location.href;
  if (!isSignInWithEmailLink(getFirebaseAuth(), href)) return false;
  signInLink = href;
  const url = new URL(href);
  for (const param of SIGN_IN_LINK_PARAMS) url.searchParams.delete(param);
  window.history.replaceState(window.history.state, '', url);
  return true;
};

/** Whether a sign-in link is waiting for the visitor's email address. */
export const hasSignInLink = () => signInLink !== undefined;

export const storedSignInEmail = (): string | null => {
  try {
    return storage().getItem(SIGN_IN_EMAIL_KEY);
  } catch {
    return null;
  }
};

/**
 * Finishes signing in with the link the page was opened from. With the wrong address, the link is
 * kept to try again. A message explains other errors.
 */
export const finishSignInWithLink = async (
  email: string,
): Promise<'signed-in' | 'wrong-email' | 'failed'> => {
  if (!signInLink) return 'failed';
  dispatch(pending());
  try {
    await signInWithEmailLink(getFirebaseAuth(), email, signInLink);
  } catch (error) {
    dispatch(unAuth());
    const code = error instanceof FirebaseError ? error.code : '';
    if (code === AuthErrorCodes.INVALID_EMAIL) return 'wrong-email';
    if (code === AuthErrorCodes.EXPIRED_OOB_CODE || code === AuthErrorCodes.INVALID_OOB_CODE) {
      signInLink = undefined;
      dispatch(
        queueSnackbar(
          msg('This sign-in link has expired or was already used. Ask for a new one.', {
            id: 'auth.sign-in-link-expired',
          }),
        ),
      );
    } else {
      dispatch(
        queueSnackbar(
          msg('An error has occurred. Please, try again later.', { id: 'common.general-error' }),
        ),
      );
    }
    return 'failed';
  }
  signInLink = undefined;
  try {
    storage().removeItem(SIGN_IN_EMAIL_KEY);
  } catch {
    // Nothing was stored.
  }
  dispatch(success());
  return 'signed-in';
};

export default slice.reducer;
