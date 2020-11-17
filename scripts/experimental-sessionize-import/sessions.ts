import data from '../../sessionize.json';
import { firestore } from '../firebase-config';
import { Answer, SessionizeSession } from './types';
import { categoryItem, nameToId, questionAnswer } from './utils';

export const importSessions = async () => {
  const sessions: SessionizeSession[] = convertSessions();
  const { length } = await save(sessions);
  console.log(`Imported data for ${length} sessions`);
};

const cleanTags = (text: string): string[] => {
  return text
    .split(',')
    .map((dirtyTag) => dirtyTag.trim())
    .filter(Boolean);
};

const cleanComplexity = (text: string): string => {
  return text === 'Introductory and overview' ? 'Beginner' : text;
};

const convertSpeakerIds = (ids: string[]): string[] => {
  return ids.map((sessionizeId) => {
    const speaker = data.speakers.find(({ id }) => id === sessionizeId);
    if (speaker) {
      return nameToId(speaker.fullName);
    } else {
      throw new Error(`Unable to find speaker with id ${sessionizeId}`);
    }
  });
};

const matchIcon = ({
  title,
  isServiceSession,
}: {
  title: string;
  isServiceSession: boolean;
}): string => {
  if (isServiceSession) {
    switch (true) {
      case title.toLowerCase().includes('break'):
        return 'coffee-break';
      case title.toLowerCase().includes('closing'):
      case title.toLowerCase().includes('welcome'):
        return 'opening';
      case title.toLowerCase().includes('lunch'):
        return 'lunch';
      case title.toLowerCase().includes('party'):
        return 'party';
      default:
        return '';
    }
  }
  return '';
};

const getTags = (answers: Answer[], items: number[]): string[] => {
  const isKeynote = categoryItem('Session format', items).toLowerCase() === 'keynote';
  const isLive = categoryItem('Delivery', items).toLowerCase() === 'live';
  const isPrerecorded = categoryItem('Delivery', items).toLowerCase() === 'pre-recorded';
  const tags = [
    questionAnswer('Tags', answers),
    isKeynote ? 'keynote' : '',
    isLive ? 'live' : '',
    isPrerecorded ? 'prerecorded' : '',
  ].join(',');
  return cleanTags(tags);
};

const convertSessions = (): SessionizeSession[] => {
  const sessions: SessionizeSession[] = [];
  for (const sessionData of data.sessions) {
    console.log(`Importing session ${sessionData.title}`);
    sessions.push({
      sessionizeId: sessionData.id,
      complexity: cleanComplexity(categoryItem('Level', sessionData.categoryItems)),
      description: sessionData.description || '',
      icon: matchIcon(sessionData),
      image: '',
      language: 'en',
      speakers: convertSpeakerIds(sessionData.speakers),
      tags: getTags(sessionData.questionAnswers, sessionData.categoryItems),
      title: sessionData.title,
    });
  }
  return sessions;
};

const save = async (sessions: SessionizeSession[]) => {
  if (sessions.length === 0) {
    throw new Error('No sessions found!');
  }
  console.log(`Importing ${sessions.length} sessions...`);

  const collectionRef = firestore.collection('sessions');
  const { docs } = await collectionRef.get();
  const batch = firestore.batch();

  sessions.forEach(async (session) => {
    const existingDoc = docs.find((doc) => doc.data().sessionizeId === session.sessionizeId);
    if (existingDoc) {
      batch.set(existingDoc.ref, session);
    } else {
      batch.set(collectionRef.doc(), session);
    }
  });

  return batch.commit();
};
