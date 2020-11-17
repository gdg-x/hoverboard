import data from '../../sessionize.json';
import { Badge } from '../../src/models/badge';
import { Social } from '../../src/models/social';
import { firestore } from '../firebase-config';
import { Link, SessionizeSpeaker } from './types';
import { nameToId, questionAnswer } from './utils';

export const importSpeakers = async () => {
  const speakers: SessionizeSpeaker[] = convertSpeakers();
  await save(speakers);
};

const selectBadges = (company: string): Badge[] => {
  return [
    {
      description: 'Google',
      link: 'https://www.google.com',
      name: 'google',
    },
  ].filter(({ name }) => name.toLowerCase() === company.toLowerCase());
};

const selectSocials = (links: Link[]): Social[] => {
  const approvedSources = [
    'facebook',
    'github',
    'instagram',
    'linkedin',
    'twitter',
    'website',
    'youtube',
  ];
  const approvedLinks = links.filter(({ linkType }) =>
    approvedSources.includes(linkType.toLowerCase())
  );

  return approvedLinks.map((link) => {
    return {
      icon: link.linkType.toLowerCase(),
      link: link.url,
      name: link.title,
    };
  });
};

const convertSpeakers = (): SessionizeSpeaker[] => {
  const speakers: SessionizeSpeaker[] = [];
  for (const speakerData of data.speakers) {
    console.log(`Importing speaker ${speakerData.fullName}`);
    speakers.push({
      sessionizeId: speakerData.id,
      badges: selectBadges(questionAnswer('Company', speakerData.questionAnswers)),
      bio: speakerData.bio,
      company: questionAnswer('Company', speakerData.questionAnswers),
      companyLogo: '',
      companyLogoUrl: '',
      country: questionAnswer('Location', speakerData.questionAnswers),
      featured: speakerData.isTopSpeaker,
      name: speakerData.fullName,
      order: 0,
      photo: '',
      photoUrl: speakerData.profilePicture,
      pronouns: questionAnswer('Pronouns', speakerData.questionAnswers),
      shortBio: '',
      socials: selectSocials(speakerData.links),
      title: speakerData.tagLine,
    });
  }
  return speakers;
};

const save = async (speakers: SessionizeSpeaker[]) => {
  if (speakers.length === 0) {
    throw new Error('No speakers found!');
  }
  console.log(`Importing ${speakers.length} speakers...`);

  const collectionRef = firestore.collection('speakers');
  const { docs } = await collectionRef.get();
  const batch = firestore.batch();

  speakers.forEach(async (speaker) => {
    const existingDoc = docs.find((doc) => doc.data().sessionizeId === speaker.sessionizeId);
    if (existingDoc) {
      batch.set(existingDoc.ref, speaker);
    } else {
      const id = nameToId(speaker.name);
      batch.set(collectionRef.doc(id), speaker);
    }
  });

  const { length } = await batch.commit();
  console.log(`Imported data for ${length} speakers`);
};
