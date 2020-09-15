import { TempAny } from '../../temp-any';
import { SIGN_IN, WIPE_PREVIOUS_FEEDBACK } from '../constants';
import { store } from '../store';

export const helperActions = {
  storeUser: (user?) => {
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
  },

  getFederatedProvider: (provider) => {
    switch (provider) {
      case 'https://accounts.google.com':
      case 'google.com': {
        const provider = new window.firebase.auth.GoogleAuthProvider();
        provider.addScope('profile');
        provider.addScope('email');
        return provider;
      }
      case 'https://www.facebook.com':
      case 'facebook.com': {
        const provider = new window.firebase.auth.FacebookAuthProvider();
        provider.addScope('email');
        provider.addScope('public_profile');
        return provider;
      }
      case 'https://twitter.com':
      case 'twitter.com':
        return new window.firebase.auth.TwitterAuthProvider();
    }
  },

  getProviderCompanyName: (provider) => {
    switch (provider) {
      case 'https://accounts.google.com':
      case 'google.com': {
        return 'Google';
      }
      case 'https://www.facebook.com':
      case 'facebook.com': {
        return 'Facebook';
      }
      case 'https://twitter.com':
      case 'twitter.com':
        return 'Twitter';
    }
  },

  trackError: (action, method, message) => {
    console.log('trackError', action, method, message);
    if (window.ga) {
      ga('send', 'event', 'error', action + ':' + method, message);
    } else {
      console.warn('window.ga not defined');
    }
  },
};
