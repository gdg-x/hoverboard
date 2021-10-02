import {
  AuthenticatedUser,
  isAuthenticated,
  isUnauthenticated,
  UnauthenticatedUser,
  User,
} from './user';
import { allKeys } from './utils';

const users: User[] = [
  {
    signedIn: false,
  },
  {
    signedIn: true,
    uid: 'abcxyz',
    email: 'sam@example.com',
    displayName: 'Sam Smith',
    photoURL: 'https://example.com/sam.jpg',
    refreshToken: 'xyzabc',
    initialProviderId: 'google.com',
  },
];

describe('user', () => {
  describe('authenticated', () => {
    it('matches the shape of the default data', () => {
      const authenticatedUsers: AuthenticatedUser[] = users.filter(isAuthenticated);
      const keys: Array<keyof AuthenticatedUser> = [
        'displayName',
        'email',
        'initialProviderId',
        'photoURL',
        'refreshToken',
        'signedIn',
        'uid',
      ];
      expect(authenticatedUsers).toHaveLength(1);
      expect(allKeys(authenticatedUsers)).toStrictEqual(keys);
    });
  });

  describe('unauthenticated', () => {
    it('matches the shape of the default data', () => {
      const unauthenticatedUsers: UnauthenticatedUser[] = users.filter(isUnauthenticated);
      const keys: Array<keyof UnauthenticatedUser> = ['signedIn'];
      expect(unauthenticatedUsers).toHaveLength(1);
      expect(allKeys(unauthenticatedUsers)).toStrictEqual(keys);
    });
  });
});
