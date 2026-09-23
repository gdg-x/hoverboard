import { FacebookAuthProvider, GoogleAuthProvider, TwitterAuthProvider } from 'firebase/auth';
import { describe, expect, it } from 'vitest';
import {
  getFederatedProvider,
  getFederatedProviderClass,
  getProviderCompanyName,
  PROVIDER,
} from './providers';

describe('getFederatedProvider', () => {
  it('returns a GoogleAuthProvider for google', () => {
    expect(getFederatedProvider(PROVIDER['google.com'])).toBeInstanceOf(GoogleAuthProvider);
    expect(getFederatedProvider(PROVIDER['https://accounts.google.com'])).toBeInstanceOf(
      GoogleAuthProvider,
    );
  });

  it('returns a FacebookAuthProvider for facebook', () => {
    expect(getFederatedProvider(PROVIDER['facebook.com'])).toBeInstanceOf(FacebookAuthProvider);
    expect(getFederatedProvider(PROVIDER['https://www.facebook.com'])).toBeInstanceOf(
      FacebookAuthProvider,
    );
  });

  it('returns a TwitterAuthProvider for twitter', () => {
    expect(getFederatedProvider(PROVIDER['twitter.com'])).toBeInstanceOf(TwitterAuthProvider);
    expect(getFederatedProvider(PROVIDER['https://twitter.com'])).toBeInstanceOf(
      TwitterAuthProvider,
    );
  });

  it('throws for an unsupported provider', () => {
    expect(() => getFederatedProvider('other' as PROVIDER)).toThrow('Unsupported provider');
  });
});

describe('getFederatedProviderClass', () => {
  it('returns the GoogleAuthProvider class for google', () => {
    expect(getFederatedProviderClass(PROVIDER['google.com'])).toBe(GoogleAuthProvider);
  });

  it('returns the FacebookAuthProvider class for facebook', () => {
    expect(getFederatedProviderClass(PROVIDER['facebook.com'])).toBe(FacebookAuthProvider);
  });

  it('returns the TwitterAuthProvider class for twitter', () => {
    expect(getFederatedProviderClass(PROVIDER['twitter.com'])).toBe(TwitterAuthProvider);
  });

  it('throws for an unsupported provider', () => {
    expect(() => getFederatedProviderClass('other' as PROVIDER)).toThrow('Unsupported provider');
  });
});

describe('getProviderCompanyName', () => {
  it('returns Google for google', () => {
    expect(getProviderCompanyName(PROVIDER['google.com'])).toBe('Google');
  });

  it('returns Facebook for facebook', () => {
    expect(getProviderCompanyName(PROVIDER['facebook.com'])).toBe('Facebook');
  });

  it('returns Twitter for twitter', () => {
    expect(getProviderCompanyName(PROVIDER['twitter.com'])).toBe('Twitter');
  });

  it('throws for an unsupported provider', () => {
    expect(() => getProviderCompanyName('other' as PROVIDER)).toThrow('Unsupported provider');
  });
});
