import { UserInfo, User as FirebaseUser } from 'firebase/auth';

export { FirebaseUser };
export type User = UserInfo;

export const toUser = (user: FirebaseUser): User => {
  return user.toJSON() as User;
};
