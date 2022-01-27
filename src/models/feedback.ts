export interface Feedback {
  comment: string;
  contentRating: number;
  parentId: string;
  styleRating: number;
  userId: string; // collectionGroup can't query off of document id. https://stackoverflow.com/q/56188250/26406
  id: string;
}

export type FeedbackData = Omit<Feedback, 'userId' | 'parentId' | 'id'>;
export type FeedbackId = Pick<Feedback, 'userId' | 'parentId' | 'id'>;
