export const importSpeakers = (firestore, data) => {
  const speakers = data.speakers;
  if (!Object.keys(speakers).length) {
    return false;
  }
  console.log('\tImporting', Object.keys(speakers).length, 'speakers...');

  const batch = firestore.batch();

  Object.keys(speakers).forEach((speakerId, order) => {
    batch.set(firestore.collection('speakers').doc(speakerId), {
      ...speakers[speakerId],
      order,
    });
  });

  return batch.commit().then((results) => {
    console.log('\tImported data for', results.length, 'speakers');
    return results;
  });
};

export const importPreviousSpeakers = (firestore, data) => {
  const previousSpeakers = data.previousSpeakers;
  if (!Object.keys(previousSpeakers).length) {
    return false;
  }
  console.log('\tImporting', Object.keys(previousSpeakers).length, 'previous speakers...');

  const batch = firestore.batch();

  Object.keys(previousSpeakers).forEach((speakerId, order) => {
    batch.set(firestore.collection('previousSpeakers').doc(speakerId), {
      ...previousSpeakers[speakerId],
      order,
    });
  });

  return batch.commit().then((results) => {
    console.log('\tImported data for', results.length, 'previous speakers');
    return results;
  });
};

export const importTeam = (firestore, data) => {
  const teams = data.team;
  if (!Object.keys(teams).length) {
    return false;
  }
  console.log('\tImporting', Object.keys(teams).length, 'subteam...');

  const batch = firestore.batch();

  Object.keys(teams).forEach((teamId) => {
    batch.set(firestore.collection('team').doc(teamId), {
      title: teams[teamId].title,
    });

    teams[teamId].members.forEach((member, id) => {
      batch.set(
        firestore.collection('team').doc(`${teamId}`).collection('members').doc(`${id}`),
        member
      );
    });
  });

  return batch.commit().then((results) => {
    console.log('\tImported data for', results.length, 'documents');
    return results;
  });
};

export const importPartners = (firestore, data) => {
  const partners = data.partners;
  if (!Object.keys(partners).length) {
    return false;
  }
  console.log('\tImporting partners...');

  const batch = firestore.batch();

  Object.keys(partners).forEach((docId) => {
    batch.set(firestore.collection('partners').doc(docId), {
      title: partners[docId].title,
      order: partners[docId].order,
    });

    partners[docId].logos.forEach((item, id) => {
      batch.set(
        firestore
          .collection('partners')
          .doc(`${docId}`)
          .collection('items')
          .doc(`${id}`.padStart(3, 0)),
        item
      );
    });
  });

  return batch.commit().then((results) => {
    console.log('\tImported data for', results.length, 'documents');
    return results;
  });
};

export const importGallery = (firestore, data) => {
  const gallery = data.gallery;
  if (!Object.keys(gallery).length) {
    return false;
  }
  console.log('\tImporting gallery...');

  const batch = firestore.batch();

  Object.keys(gallery).forEach((docId) => {
    batch.set(firestore.collection('gallery').doc(`${docId}`.padStart(3, 0)), {
      url: gallery[docId],
      order: docId,
    });
  });

  return batch.commit().then((results) => {
    console.log('\tImported data for', results.length, 'images');
    return results;
  });
};

export const importBlog = (firestore, data) => {
  const blog = data.blog;
  if (!Object.keys(blog).length) {
    return false;
  }
  console.log('\tImporting blog...');

  const batch = firestore.batch();

  Object.keys(blog).forEach((docId) => {
    batch.set(firestore.collection('blog').doc(docId), blog[docId]);
  });

  return batch.commit().then((results) => {
    console.log('\tImported data for', results.length, 'blog posts');
    return results;
  });
};

export const importVideos = (firestore, data) => {
  const docs = data.videos;
  if (!Object.keys(docs).length) {
    return false;
  }
  console.log('\tImporting videos...');

  const batch = firestore.batch();

  Object.keys(docs).forEach((docId) => {
    batch.set(firestore.collection('videos').doc(`${docId}`.padStart(3, 0)), {
      ...docs[docId],
      order: docId,
    });
  });

  return batch.commit().then((results) => {
    console.log('\tImported data for', results.length, 'videos');
    return results;
  });
};

export const importTickets = (firestore, data) => {
  const docs = data.tickets;
  if (!Object.keys(docs).length) {
    return false;
  }
  console.log('\tImporting tickets...');

  const batch = firestore.batch();

  Object.keys(docs).forEach((docId) => {
    batch.set(firestore.collection('tickets').doc(`${docId}`.padStart(3, 0)), {
      ...docs[docId],
      order: docId,
    });
  });

  return batch.commit().then((results) => {
    console.log('\tImported data for', results.length, 'tickets');
    return results;
  });
};

export const importSessions = (firestore, data) => {
  const docs = data.sessions;
  if (!Object.keys(docs).length) {
    return false;
  }
  console.log('\tImporting sessions...');

  const batch = firestore.batch();

  Object.keys(docs).forEach((docId) => {
    batch.set(firestore.collection('sessions').doc(docId), docs[docId]);
  });

  return batch.commit().then((results) => {
    console.log('\tImported data for', results.length, 'sessions');
    return results;
  });
};

export const importSchedule = (firestore, data) => {
  const docs = data.schedule;
  if (!Object.keys(docs).length) {
    return false;
  }
  console.log('\tImporting schedule...');

  const batch = firestore.batch();

  Object.keys(docs).forEach((docId) => {
    batch.set(firestore.collection('schedule').doc(docId), {
      ...docs[docId],
      date: docId,
    });
  });

  return batch.commit().then((results) => {
    console.log('\tImported data for', Object.keys(docs).length, 'days');
    return results;
  });
};

export const importNotificationsConfig = async (firestore, data) => {
  const notificationsConfig = data.notifications.config;
  console.log('Migrating notifications config...');
  const batch = firestore.batch();

  batch.set(firestore.collection('config').doc('notifications'), notificationsConfig);

  return batch.commit().then((results) => {
    console.log('\tImported data for notifications config');
    return results;
  });
};
