import { FacebookAuthProvider, GoogleAuthProvider, TwitterAuthProvider } from 'firebase/auth';

export enum PROVIDER {
  'https://accounts.google.com' = 'https://accounts.google.com',
  'google.com' = 'google.com',
  'https://www.facebook.com' = 'https://www.facebook.com',
  'facebook.com' = 'facebook.com',
  'https://twitter.com' = 'https://twitter.com',
  'twitter.com' = 'twitter.com',
}

export const getFederatedProvider = (provider: PROVIDER) => {
  switch (provider) {
    case 'https://accounts.google.com':
    case 'google.com': {
      const provider = new GoogleAuthProvider();
      provider.addScope('profile');
      provider.addScope('email');
      return provider;
    }

    case 'https://www.facebook.com':
    case 'facebook.com': {
      const provider = new FacebookAuthProvider();
      provider.addScope('email');
      provider.addScope('public_profile');
      return provider;
    }

    case 'https://twitter.com':
    case 'twitter.com':
      return new TwitterAuthProvider();

    default:
      throw new Error('Unsupported provider');
  }
};

export const getFederatedProviderClass = (provider: PROVIDER) => {
  switch (provider) {
    case 'https://accounts.google.com':
    case 'google.com':
      return GoogleAuthProvider;

    case 'https://www.facebook.com':
    case 'facebook.com':
      return FacebookAuthProvider;

    case 'https://twitter.com':
    case 'twitter.com':
      return TwitterAuthProvider;

    default:
      throw new Error('Unsupported provider');
  }
};

export const getProviderCompanyName = (provider: PROVIDER) => {
  switch (provider) {
    case 'https://accounts.google.com':
    case 'google.com':
      return 'Google';

    case 'https://www.facebook.com':
    case 'facebook.com':
      return 'Facebook';

    case 'https://twitter.com':
    case 'twitter.com':
      return 'Twitter';

    default:
      throw new Error('Unsupported provider');
  }
};
