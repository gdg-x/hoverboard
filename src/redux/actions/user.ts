import { helperActions, notificationsActions, subscribeActions } from '.';

export const userActions = {
  signIn: (providerName) => {
    const firebaseProvider = helperActions.getFederatedProvider(providerName);

    return window.firebase
      .auth()
      .signInWithPopup(firebaseProvider)
      .then((signInObject) => {
        helperActions.storeUser(signInObject.user);
        notificationsActions.getToken(true);
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
  },

  mergeAccounts: (initialProviderId, pendingCredential) => {
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
  },

  updateUser: () => {
    window.firebase.auth().onAuthStateChanged((user) => {
      helperActions.storeUser(user);
    });
  },

  signOut: () => {
    return window.firebase
      .auth()
      .signOut()
      .then(() => {
        helperActions.storeUser();
        subscribeActions.resetSubscribed();
      });
  },
};
