import { Session } from '../../src/models/session';
import { Speaker } from '../../src/models/speaker';

export interface Question {
  id: number;
  question: string;
  questionType: string;
  sort: number;
}

export interface Answer {
  questionId: number;
  answerValue: string;
}

export interface Link {
  title: string;
  url: string;
  linkType: string;
}

export type SessionizeSpeaker = Speaker & {
  sessionizeId: string;
};

export type SessionizeSession = Session & {
  sessionizeId: string;
};
