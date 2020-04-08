type Member = import('./member').Member;

export interface Team {
  members: Member[];
  title: string;
}
