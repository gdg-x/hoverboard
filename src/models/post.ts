import { Id } from './types';

export interface PostData {
  backgroundColor: string;
  brief: string;
  content: string;
  image: string;
  published: string;
  source?: string;
  title: string;
}

export type Post = PostData & Id;
