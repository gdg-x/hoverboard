import data from '../../sessionize.json';
import { Answer, Question } from './types';

export const nameToId = (name: string): string => {
  return name.toLowerCase().replace(/ /g, '_');
};

const findQuestion = (text: string): Question => {
  const question = data.questions.find(
    ({ question }) => question.trim().toLowerCase() === text.trim().toLowerCase()
  );

  if (question) {
    return question;
  } else {
    throw new Error(`Could not find Question with text ${text}`);
  }
};

export const questionAnswer = (question: string, answers: Answer[]): string => {
  const { id } = findQuestion(question);
  return answers.find(({ questionId }) => questionId === id)?.answerValue || '';
};

const findCategory = (text: string) => {
  const category = data.categories.find(({ title }) => {
    return title.trim().toLowerCase() === text.trim().toLowerCase();
  });

  if (category) {
    return category;
  } else {
    throw new Error(`Could not find Category with text ${text}`);
  }
};

export const categoryItem = (text: string, itemIds: number[]): string => {
  const { items } = findCategory(text);
  const item = items.find(({ id }) => itemIds.includes(id));
  return item?.name || '';
};
