import { helperActions } from '../actions';
import { getToken } from '../notifications/actions';
import { resetSubscribed } from '../subscribe/actions';

export const signIn = (providerName: string) => {
  const firebaseProvider = helperActions.getFederatedProvider(providerName);

  return window.firebase
    .auth()
    .signInWithPopup(firebaseProvider)
    .then((signInObject) => {
      helperActions.storeUser(signInObject.user);
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
          .then((providers) => {
            helperActions.storeUser({
              signedIn: false,
              initialProviderId: providers[0],
              email: error.email,
              pendingCredential: error.credential,
            });
          });
      }
      helperActions.trackError('userActions', 'signIn', error);
    });
};

export const mergeAccounts = (
  initialProviderId: string,
  pendingCredential: firebase.auth.AuthCredential
) => {
  const firebaseProvider = helperActions.getFederatedProvider(initialProviderId);

  return window.firebase
    .auth()
    .signInWithPopup(firebaseProvider)
    .then((result) => {
      result.user.linkWithCredential(pendingCredential);
    })
    .catch((error) => {
      helperActions.trackError('userActions', 'mergeAccounts', error);
    });
};

export const updateUser = () => {
  window.firebase.auth().onAuthStateChanged((user) => {
    helperActions.storeUser(user);
  });
};

export const signOut = () => {
  return window.firebase
    .auth()
    .signOut()
    .then(() => {
      helperActions.storeUser();
      resetSubscribed();
    });
};
