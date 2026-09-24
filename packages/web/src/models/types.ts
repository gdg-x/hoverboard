export interface Id {
  id: string;
}

export type ParentId = Id & {
  parentId: string;
};
