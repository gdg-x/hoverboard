import { store } from '..';
import { TempAny } from '../../../functions/src/temp-any';
import { getFederatedProvider, PROVIDERS } from '../../utils/providers';
import { WIPE_PREVIOUS_FEEDBACK } from '../feedback/types';
import { getToken } from '../notifications/actions';
import { resetSubscribed } from '../subscribe/actions';
import { SIGN_IN } from './types';

export const signIn = (providerName: PROVIDERS) => {
  const firebaseProvider = getFederatedProvider(providerName);

  return window.firebase
    .auth()
    .signInWithPopup(firebaseProvider)
    .then((signInObject) => {
      storeUser(signInObject.user);
      getToken(true);
    })
    .catch((error) => {
      if (
        error.code === 'auth/account-exists-with-different-credential' ||
        error.code === 'auth/email-already-in-use'
      ) {
        window.firebase
          .auth()
          .fetchSignInMethodsForEmail(error.email)
          .then((providers: PROVIDERS[]) => {
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

export const mergeAccounts = (
  initialProviderId: PROVIDERS,
  pendingCredential: firebase.auth.AuthCredential
) => {
  const firebaseProvider = getFederatedProvider(initialProviderId);

  return window.firebase
    .auth()
    .signInWithPopup(firebaseProvider)
    .then((result) => {
      result.user.linkWithCredential(pendingCredential);
    })
    .catch(() => {});
};

export const updateUser = () => {
  window.firebase.auth().onAuthStateChanged((user) => {
    storeUser(user);
  });
};

export const signOut = () => {
  return window.firebase
    .auth()
    .signOut()
    .then(() => {
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
