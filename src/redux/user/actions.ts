import { getFederatedProvider, storeUser, trackError } from '../helpers/actions';
import { Providers } from '../helpers/types';
import { getToken } from '../notifications/actions';
import { resetSubscribed } from '../subscribe/actions';

export const signIn = (providerName: Providers) => {
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
          .then((providers: Providers[]) => {
            storeUser({
              signedIn: false,
              initialProviderId: providers[0],
              email: error.email,
              pendingCredential: error.credential,
            });
          });
      }
      trackError('userActions', 'signIn', error);
    });
};

export const mergeAccounts = (
  initialProviderId: Providers,
  pendingCredential: firebase.auth.AuthCredential
) => {
  const firebaseProvider = getFederatedProvider(initialProviderId);

  return window.firebase
    .auth()
    .signInWithPopup(firebaseProvider)
    .then((result) => {
      result.user.linkWithCredential(pendingCredential);
    })
    .catch((error) => {
      trackError('userActions', 'mergeAccounts', error);
    });
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
