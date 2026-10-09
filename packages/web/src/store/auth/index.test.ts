import { Failure, Initialized, Pending, Success } from '@abraham/remotedata';
import { FirebaseError } from 'firebase/app';
import {
  type AuthError,
  AuthErrorCodes,
  fetchSignInMethodsForEmail,
  getAuth,
  isSignInWithEmailLink,
  linkWithCredential,
  onAuthStateChanged,
  sendSignInLinkToEmail,
  signInWithEmailLink,
  signInWithPopup,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { FirebaseUser } from '../../models/user';
import { logLogin } from '../../utils/analytics';
import { getFederatedProvider, getFederatedProviderClass, PROVIDER } from '../../utils/providers';
import { dispatch } from '../dispatch';
import { resetFeaturedSessions } from '../featured-sessions';
import { unsubscribeFromFeedback } from '../feedback';
import { resetSubscribed } from '../subscribe';
import { removeUser, setUser } from '../user';
import type { RootState } from '..';

vi.mock('../dispatch');
vi.mock('../../utils/analytics', () => ({
  logLogin: vi.fn(),
}));
vi.mock('../../utils/providers', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../utils/providers')>();

  return {
    ...actual,
    getFederatedProvider: vi.fn(),
    getFederatedProviderClass: vi.fn(),
  };
});
vi.mock('../featured-sessions', () => ({
  resetFeaturedSessions: vi.fn(),
}));
vi.mock('../feedback', () => ({
  unsubscribeFromFeedback: vi.fn(() => ({ type: 'feedback/unsubscribeFromFeedback' })),
}));
vi.mock('../subscribe', () => ({
  resetSubscribed: vi.fn(),
}));
vi.mock('../user', () => ({
  removeUser: vi.fn(),
  setUser: vi.fn(),
}));
vi.mock('firebase/auth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('firebase/auth')>();

  return {
    ...actual,
    fetchSignInMethodsForEmail: vi.fn(),
    getAuth: vi.fn(),
    isSignInWithEmailLink: vi.fn(),
    linkWithCredential: vi.fn(),
    onAuthStateChanged: vi.fn(),
    sendSignInLinkToEmail: vi.fn(),
    signInWithEmailLink: vi.fn(),
    signInWithPopup: vi.fn(),
    signOut: vi.fn(),
  };
});

const googleProvider = PROVIDER['google.com'];
const facebookProvider = PROVIDER['facebook.com'];

const loadModule = async () => import('.');

const flushPromises = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

const createAuthError = (code: string, email = 'ada@example.com') =>
  Object.assign(new FirebaseError(code, 'boom'), {
    customData: { email },
  }) as AuthError;

describe('auth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('starts in the Initialized state and handles reducer transitions', async () => {
    const { default: reducer } = await loadModule();
    const payload = {
      code: AuthErrorCodes.EMAIL_EXISTS,
      credential: null,
      email: 'ada@example.com',
      providerId: facebookProvider,
    };

    expect(reducer(undefined, { type: '@@INIT' })).toStrictEqual(new Initialized());
    expect(reducer(new Initialized(), { type: 'auth/pending' })).toStrictEqual(new Pending());
    expect(reducer(new Pending(), { type: 'auth/success' })).toStrictEqual(new Success(true));
    expect(reducer(new Pending(), { type: 'auth/failure', payload })).toStrictEqual(
      new Failure(payload),
    );
    expect(reducer(new Success(true), { type: 'auth/unAuth' })).toStrictEqual(new Initialized());
  });

  it('detects mergeable auth failures', async () => {
    const { selectAuthMergeable } = await loadModule();
    const mergeableState = {
      auth: new Failure({
        code: AuthErrorCodes.EMAIL_EXISTS,
        credential: null,
        email: 'ada@example.com',
        providerId: facebookProvider,
      }),
    } as unknown as RootState;
    const nonMergeableState = {
      auth: new Failure({
        code: 'auth/invalid-credential',
        credential: null,
        email: 'ada@example.com',
        providerId: facebookProvider,
      }),
    } as unknown as RootState;

    expect(selectAuthMergeable(mergeableState)).toBe(true);
    expect(selectAuthMergeable(nonMergeableState)).toBe(false);
  });
});

describe('auth helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('dispatches pending and success when sign-in succeeds', async () => {
    const provider = { providerId: googleProvider };
    const auth = { name: 'firebase-auth' };
    vi.mocked(getFederatedProvider).mockReturnValue(provider as never);
    vi.mocked(getAuth).mockReturnValue(auth as never);
    vi.mocked(signInWithPopup).mockResolvedValue({ user: {} } as never);
    const { signIn } = await loadModule();

    await signIn(googleProvider);

    expect(signInWithPopup).toHaveBeenCalledWith(auth, provider);
    expect(dispatch).toHaveBeenNthCalledWith(1, expect.objectContaining({ type: 'auth/pending' }));
    expect(dispatch).toHaveBeenNthCalledWith(2, expect.objectContaining({ type: 'auth/success' }));
  });

  it('dispatches a structured failure when sign-in needs account confirmation', async () => {
    const provider = { providerId: googleProvider };
    const providerClass = {
      credentialFromError: vi.fn().mockReturnValue({ providerId: googleProvider }),
    };
    const auth = { name: 'firebase-auth' };
    vi.mocked(getFederatedProvider).mockReturnValue(provider as never);
    vi.mocked(getFederatedProviderClass).mockReturnValue(providerClass as never);
    vi.mocked(getAuth).mockReturnValue(auth as never);
    vi.mocked(signInWithPopup).mockRejectedValue(createAuthError(AuthErrorCodes.EMAIL_EXISTS));
    vi.mocked(fetchSignInMethodsForEmail).mockResolvedValue([facebookProvider]);
    const { signIn } = await loadModule();

    await signIn(googleProvider);
    await flushPromises();

    expect(fetchSignInMethodsForEmail).toHaveBeenCalledWith(auth, 'ada@example.com');
    expect(dispatch).toHaveBeenNthCalledWith(1, expect.objectContaining({ type: 'auth/pending' }));
    expect(dispatch).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        type: 'auth/failure',
        payload: {
          code: AuthErrorCodes.EMAIL_EXISTS,
          credential: { providerId: googleProvider },
          email: 'ada@example.com',
          providerId: facebookProvider,
        },
      }),
    );
  });

  it('rethrows non-Firebase sign-in errors', async () => {
    vi.mocked(getFederatedProvider).mockReturnValue({ providerId: googleProvider } as never);
    vi.mocked(signInWithPopup).mockRejectedValue(new Error('unexpected'));
    const { signIn } = await loadModule();

    await expect(signIn(googleProvider)).rejects.toThrow('unexpected');
  });

  it('links credentials and dispatches success when merging accounts succeeds', async () => {
    const provider = { providerId: googleProvider };
    const auth = { name: 'firebase-auth' };
    const user = { uid: 'user-1' };
    const pendingCredential = { providerId: facebookProvider } as never;
    vi.mocked(getFederatedProvider).mockReturnValue(provider as never);
    vi.mocked(getAuth).mockReturnValue(auth as never);
    vi.mocked(signInWithPopup).mockResolvedValue({ user } as never);
    const { mergeAccounts } = await loadModule();

    await mergeAccounts(googleProvider, pendingCredential);

    expect(linkWithCredential).toHaveBeenCalledWith(user, pendingCredential);
    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'auth/success' }));
  });

  it('dispatches a structured failure when account merging fails with a Firebase error', async () => {
    const provider = { providerId: googleProvider };
    const providerClass = {
      credentialFromError: vi.fn().mockReturnValue({ providerId: googleProvider }),
    };
    const auth = { name: 'firebase-auth' };
    vi.mocked(getFederatedProvider).mockReturnValue(provider as never);
    vi.mocked(getFederatedProviderClass).mockReturnValue(providerClass as never);
    vi.mocked(getAuth).mockReturnValue(auth as never);
    vi.mocked(signInWithPopup).mockRejectedValue(createAuthError(AuthErrorCodes.NEED_CONFIRMATION));
    vi.mocked(fetchSignInMethodsForEmail).mockResolvedValue([facebookProvider]);
    const { mergeAccounts } = await loadModule();

    await mergeAccounts(googleProvider, { providerId: facebookProvider } as never);
    await flushPromises();

    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'auth/failure',
        payload: {
          code: AuthErrorCodes.NEED_CONFIRMATION,
          credential: { providerId: googleProvider },
          email: 'ada@example.com',
          providerId: facebookProvider,
        },
      }),
    );
  });

  it('handles authenticated users from onAuthStateChanged', async () => {
    const auth = { name: 'firebase-auth' };
    const user = { uid: 'user-1' } as FirebaseUser;
    vi.mocked(getAuth).mockReturnValue(auth as never);
    vi.mocked(onAuthStateChanged).mockImplementation((_auth, callback) => {
      (callback as (user: FirebaseUser | null) => void)(user);
      return vi.fn();
    });
    const { onUser } = await loadModule();

    onUser();

    expect(onAuthStateChanged).toHaveBeenCalledWith(auth, expect.any(Function));
    expect(setUser).toHaveBeenCalledWith(user);
    expect(logLogin).toHaveBeenCalled();
    expect(removeUser).not.toHaveBeenCalled();
  });

  it('handles signed-out users from onAuthStateChanged', async () => {
    const auth = { name: 'firebase-auth' };
    vi.mocked(getAuth).mockReturnValue(auth as never);
    vi.mocked(onAuthStateChanged).mockImplementation((_auth, callback) => {
      (callback as (user: FirebaseUser | null) => void)(null);
      return vi.fn();
    });
    const { onUser } = await loadModule();

    onUser();

    expect(dispatch).toHaveBeenNthCalledWith(1, expect.objectContaining({ type: 'auth/unAuth' }));
    expect(removeUser).toHaveBeenCalled();
    expect(resetSubscribed).toHaveBeenCalled();
    expect(unsubscribeFromFeedback).toHaveBeenCalled();
    expect(dispatch).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ type: 'feedback/unsubscribeFromFeedback' }),
    );
    expect(resetFeaturedSessions).toHaveBeenCalled();
  });

  it('signs out through Firebase auth', async () => {
    const auth = { name: 'firebase-auth' };
    vi.mocked(getAuth).mockReturnValue(auth as never);
    vi.mocked(firebaseSignOut).mockResolvedValue(undefined);
    const { signOut } = await loadModule();

    await signOut();

    expect(firebaseSignOut).toHaveBeenCalledWith(auth);
  });
});

describe('email link sign-in', () => {
  const auth = { name: 'firebase-auth' };
  const link =
    'http://localhost/schedule?tags=Web&apiKey=key&oobCode=code&mode=signIn&lang=en#10:00';

  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    localStorage.clear();
    vi.mocked(getAuth).mockReturnValue(auth as never);
  });

  afterEach(() => {
    window.history.replaceState(null, '', '/');
  });

  it('emails a link back to the current page, and remembers the address', async () => {
    window.history.replaceState(null, '', '/schedule?tags=Web#10:00');
    const { sendSignInLink } = await loadModule();

    await sendSignInLink('ada@example.com');

    expect(sendSignInLinkToEmail).toHaveBeenCalledWith(auth, 'ada@example.com', {
      url: 'http://localhost/schedule?tags=Web',
      handleCodeInApp: true,
    });
    expect(localStorage.getItem('hb-sign-in-email')).toBe('ada@example.com');
  });

  it('ignores pages that were not opened from a sign-in link', async () => {
    vi.mocked(isSignInWithEmailLink).mockReturnValue(false);
    const { hasSignInLink, takeSignInLink } = await loadModule();

    expect(takeSignInLink()).toBe(false);
    expect(hasSignInLink()).toBe(false);
  });

  it('takes the link out of the URL and signs in with it', async () => {
    window.history.replaceState(null, '', link);
    vi.mocked(isSignInWithEmailLink).mockReturnValue(true);
    localStorage.setItem('hb-sign-in-email', 'ada@example.com');
    const { finishSignInWithLink, hasSignInLink, storedSignInEmail, takeSignInLink } =
      await loadModule();

    expect(takeSignInLink()).toBe(true);
    expect(window.location.href).toBe('http://localhost/schedule?tags=Web#10:00');
    expect(hasSignInLink()).toBe(true);

    expect(await finishSignInWithLink(storedSignInEmail()!)).toBe('signed-in');
    expect(signInWithEmailLink).toHaveBeenCalledWith(auth, 'ada@example.com', link);
    expect(dispatch).toHaveBeenNthCalledWith(1, expect.objectContaining({ type: 'auth/pending' }));
    expect(dispatch).toHaveBeenNthCalledWith(2, expect.objectContaining({ type: 'auth/success' }));
    expect(hasSignInLink()).toBe(false);
    expect(localStorage.getItem('hb-sign-in-email')).toBeNull();
  });

  it('keeps the link to try another address', async () => {
    window.history.replaceState(null, '', link);
    vi.mocked(isSignInWithEmailLink).mockReturnValue(true);
    vi.mocked(signInWithEmailLink).mockRejectedValue(createAuthError(AuthErrorCodes.INVALID_EMAIL));
    const { finishSignInWithLink, hasSignInLink, takeSignInLink } = await loadModule();
    takeSignInLink();

    expect(await finishSignInWithLink('grace@example.com')).toBe('wrong-email');
    expect(hasSignInLink()).toBe(true);
    expect(dispatch).toHaveBeenLastCalledWith(expect.objectContaining({ type: 'auth/unAuth' }));
  });

  it('drops an expired link and says to ask for a new one', async () => {
    window.history.replaceState(null, '', link);
    vi.mocked(isSignInWithEmailLink).mockReturnValue(true);
    vi.mocked(signInWithEmailLink).mockRejectedValue(
      createAuthError(AuthErrorCodes.EXPIRED_OOB_CODE),
    );
    const { finishSignInWithLink, hasSignInLink, takeSignInLink } = await loadModule();
    takeSignInLink();

    expect(await finishSignInWithLink('ada@example.com')).toBe('failed');
    expect(hasSignInLink()).toBe(false);
    expect(dispatch).toHaveBeenLastCalledWith({
      type: 'snackbars/queueSnackbar',
      payload: 'This sign-in link has expired or was already used. Ask for a new one.',
    });
  });
});
