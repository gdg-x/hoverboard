import {
  AuthCredential,
  fetchSignInMethodsForEmail,
  getAuth,
  linkWithCredential,
  onAuthStateChanged,
  signInWithPopup,
  signOut as fbSignOut,
} from 'firebase/auth';
import { store } from '..';
import { firebaseApp } from '../../firebase';
import { TempAny } from '../../temp-any';
import { getFederatedProvider, PROVIDERS } from '../../utils/providers';
import { WIPE_PREVIOUS_FEEDBACK } from '../feedback/types';
import { getToken } from '../notifications/actions';
import { resetSubscribed } from '../subscribe/actions';
import { SIGN_IN } from './types';

const auth = getAuth(firebaseApp);

export const signIn = (providerName: PROVIDERS) => {
  const firebaseProvider = getFederatedProvider(providerName);

  return signInWithPopup(auth, firebaseProvider)
    .then((signInObject) => {
      storeUser(signInObject.user);
      getToken(true);
    })
    .catch((error) => {
      if (
        error.code === 'auth/account-exists-with-different-credential' ||
        error.code === 'auth/email-already-in-use'
      ) {
        fetchSignInMethodsForEmail(auth, error.email).then((providers) => {
          storeUser({
            signedIn: false,
            initialProviderId: providers[0],
            email: error.email,
            pendingCredential: error.credential,
          });
        });
      }
    });
};

export const mergeAccounts = (initialProviderId: PROVIDERS, pendingCredential: AuthCredential) => {
  const firebaseProvider = getFederatedProvider(initialProviderId);

  return signInWithPopup(auth, firebaseProvider)
    .then((result) => {
      linkWithCredential(result.user, pendingCredential);
    })
    .catch(() => {});
};

export const updateUser = () => {
  onAuthStateChanged(auth, (user) => {
    storeUser(user);
  });
};

export const signOut = () => {
  return fbSignOut(auth).then(() => {
    storeUser();
    resetSubscribed();
  });
};

const storeUser = (user?: TempAny) => {
  let userToStore: TempAny = { signedIn: false };

  if (user) {
    const { uid, displayName, photoURL, refreshToken, actualProvider, pendingCredential } = user;

    const email = user.email || (user.providerData && user.providerData[0].email);
    const initialProviderId =
      (user.providerData && user.providerData[0].providerId) || user.initialProviderId;
    const signedIn = (user.uid && true) || user.signedIn;

    userToStore = {
      signedIn,
      uid,
      email,
      displayName,
      photoURL,
      refreshToken,
      initialProviderId,
      actualProvider,
      pendingCredential,
    };
  }

  store.dispatch({
    type: SIGN_IN,
    user: userToStore,
  });

  if (!userToStore.signedIn) store.dispatch({ type: WIPE_PREVIOUS_FEEDBACK });
};
