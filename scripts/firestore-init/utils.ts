import { firestore } from '../firebase-config';
import data from '../../docs/default-firebase-data.json';

export const importSpeakers = () => {
  const speakers: { [key: string]: object } = data.speakers;
  if (!Object.keys(speakers).length) {
    return Promise.resolve();
  }
  console.log('Importing', Object.keys(speakers).length, 'speakers...');

  const batch = firestore.batch();

  Object.keys(speakers).forEach((speakerId, order) => {
    batch.set(firestore.collection('speakers').doc(speakerId), {
      ...speakers[speakerId],
      order,
    });
  });

  return batch.commit().then((results) => {
    console.log('Imported data for', results.length, 'speakers');
  });
};

export const importPreviousSpeakers = () => {
  const previousSpeakers: { [key: string]: object } = data.previousSpeakers;
  if (!Object.keys(previousSpeakers).length) {
    return Promise.resolve();
  }
  console.log('Importing', Object.keys(previousSpeakers).length, 'previous speakers...');

  const batch = firestore.batch();

  Object.keys(previousSpeakers).forEach((speakerId, order) => {
    batch.set(firestore.collection('previousSpeakers').doc(speakerId), {
      ...previousSpeakers[speakerId],
      order,
    });
  });

  return batch.commit().then((results) => {
    console.log('Imported data for', results.length, 'previous speakers');
  });
};

export const importTeam = () => {
  const teams = data.team;
  if (!Object.keys(teams).length) {
    return Promise.resolve();
  }
  console.log('Importing', Object.keys(teams).length, 'subteam...');

  const batch = firestore.batch();

  Object.keys(teams).forEach((teamId) => {
    batch.set(firestore.collection('team').doc(teamId), {
      title: teams[Number(teamId)].title,
    });

    teams[Number(teamId)].members.forEach((member, id) => {
      batch.set(
        firestore.collection('team').doc(`${teamId}`).collection('members').doc(`${id}`),
        member
      );
    });
  });

  return batch.commit().then((results) => {
    console.log('Imported data for', results.length, 'documents');
  });
};

export const importPartners = () => {
  const partners = data.partners;
  if (!Object.keys(partners).length) {
    return Promise.resolve();
  }
  console.log('Importing partners...');

  const batch = firestore.batch();

  Object.keys(partners).forEach((docId) => {
    batch.set(firestore.collection('partners').doc(docId), {
      title: partners[Number(docId)].title,
      order: partners[Number(docId)].order,
    });

    partners[Number(docId)].logos.forEach((item, id) => {
      batch.set(
        firestore
          .collection('partners')
          .doc(`${docId}`)
          .collection('items')
          .doc(`${id}`.padStart(3, '0')),
        item
      );
    });
  });

  return batch.commit().then((results) => {
    console.log('Imported data for', results.length, 'documents');
  });
};

export const importGallery = () => {
  const gallery: string[] = data.gallery;
  if (!Object.keys(gallery).length) {
    return;
  }
  console.log('Importing gallery...');

  const batch = firestore.batch();

  Object.keys(gallery).forEach((docId: string) => {
    batch.set(firestore.collection('gallery').doc(docId.padStart(3, '0')), {
      url: gallery[Number(docId)],
      order: docId,
    });
  });

  return batch.commit().then((results) => {
    console.log('Imported data for', results.length, 'images');
  });
};

export const importBlog = () => {
  const blog: { [key: string]: object } = data.blog;
  if (!Object.keys(blog).length) {
    return Promise.resolve();
  }
  console.log('Importing blog...');

  const batch = firestore.batch();

  Object.keys(blog).forEach((docId: string) => {
    batch.set(firestore.collection('blog').doc(docId), blog[docId]);
  });

  return batch.commit().then((results) => {
    console.log('Imported data for', results.length, 'blog posts');
  });
};

export const importVideos = () => {
  const docs = data.videos;
  if (!Object.keys(docs).length) {
    return Promise.resolve();
  }
  console.log('Importing videos...');

  const batch = firestore.batch();

  Object.keys(docs).forEach((docId: string) => {
    batch.set(firestore.collection('videos').doc(docId.padStart(3, '0')), {
      ...docs[Number(docId)],
      order: docId,
    });
  });

  return batch.commit().then((results) => {
    console.log('Imported data for', results.length, 'videos');
  });
};

export const importTickets = () => {
  const docs = data.tickets;
  if (!Object.keys(docs).length) {
    return Promise.resolve();
  }
  console.log('Importing tickets...');

  const batch = firestore.batch();

  Object.keys(docs).forEach((docId: string) => {
    batch.set(firestore.collection('tickets').doc(docId.padStart(3, '0')), {
      ...docs[Number(docId)],
      order: docId,
    });
  });

  return batch.commit().then((results) => {
    console.log('Imported data for', results.length, 'tickets');
  });
};

export const importSessions = () => {
  const docs: { [key: string]: object } = data.sessions;
  if (!Object.keys(docs).length) {
    return Promise.resolve();
  }
  console.log('Importing sessions...');

  const batch = firestore.batch();

  Object.keys(docs).forEach((docId) => {
    batch.set(firestore.collection('sessions').doc(docId), docs[docId]);
  });

  return batch.commit().then((results) => {
    console.log('Imported data for', results.length, 'sessions');
  });
};

export const importSchedule = () => {
  const docs: { [key: string]: object } = data.schedule;
  if (!Object.keys(docs).length) {
    return Promise.resolve();
  }
  console.log('Importing schedule...');

  const batch = firestore.batch();

  Object.keys(docs).forEach((docId) => {
    batch.set(firestore.collection('schedule').doc(docId), {
      ...docs[docId],
      date: docId,
    });
  });

  return batch.commit().then(() => {
    console.log('Imported data for', Object.keys(docs).length, 'days');
  });
};

export const importNotificationsConfig = async () => {
  const notificationsConfig = data.notifications.config;
  console.log('Migrating notifications config...');
  const batch = firestore.batch();

  batch.set(firestore.collection('config').doc('notifications'), notificationsConfig);

  return batch.commit().then(() => {
    console.log('Imported data for notifications config');
  });
};
