import type { User as FirebaseUser } from 'firebase/auth';
import { UserInfo } from 'firebase/auth';

export type { FirebaseUser };
export type User = UserInfo;

export const toUser = (user: FirebaseUser): User => {
  return user.toJSON() as User;
};
