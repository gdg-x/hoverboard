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
    case PROVIDER['https://accounts.google.com']:
    case PROVIDER['google.com']: {
      const provider = new GoogleAuthProvider();
      provider.addScope('profile');
      provider.addScope('email');
      return provider;
    }

    case PROVIDER['https://www.facebook.com']:
    case PROVIDER['facebook.com']: {
      const provider = new FacebookAuthProvider();
      provider.addScope('email');
      provider.addScope('public_profile');
      return provider;
    }

    case PROVIDER['https://twitter.com']:
    case PROVIDER['twitter.com']:
      return new TwitterAuthProvider();

    default:
      throw new Error('Unsupported provider');
  }
};

export const getFederatedProviderClass = (provider: PROVIDER) => {
  switch (provider) {
    case PROVIDER['https://accounts.google.com']:
    case PROVIDER['google.com']:
      return GoogleAuthProvider;

    case PROVIDER['https://www.facebook.com']:
    case PROVIDER['facebook.com']:
      return FacebookAuthProvider;

    case PROVIDER['https://twitter.com']:
    case PROVIDER['twitter.com']:
      return TwitterAuthProvider;

    default:
      throw new Error('Unsupported provider');
  }
};

export const getProviderCompanyName = (provider: PROVIDER) => {
  switch (provider) {
    case PROVIDER['https://accounts.google.com']:
    case PROVIDER['google.com']:
      return 'Google';

    case PROVIDER['https://www.facebook.com']:
    case PROVIDER['facebook.com']:
      return 'Facebook';

    case PROVIDER['https://twitter.com']:
    case PROVIDER['twitter.com']:
      return 'Twitter';

    default:
      throw new Error('Unsupported provider');
  }
};
