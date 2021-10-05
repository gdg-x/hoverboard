export interface UnauthenticatedUser {
  signedIn: false;
}

export interface AuthenticatedUser {
  displayName: string;
  email: string;
  initialProviderId: string;
  photoURL: string;
  refreshToken: string;
  signedIn: true;
  uid: string;
}

export type User = UnauthenticatedUser | AuthenticatedUser;

export const isAuthenticated = (user: User): user is AuthenticatedUser => {
  return user.signedIn;
};

export const isUnauthenticated = (user: User): user is UnauthenticatedUser => {
  return !user.signedIn;
};
