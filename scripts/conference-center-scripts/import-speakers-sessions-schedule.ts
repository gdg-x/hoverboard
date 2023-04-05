// @ts-nocheck
import admin, {firestore as firestoreDep, ServiceAccount} from 'firebase-admin'
import {getSpeakersSessionsScheduleFromUrl} from './getSpeakersSessionsSchedule'

if (!process.env.firebaseServiceAccount) {
  throw new Error("firebaseServiceAccount is not defined")
}
if (!process.env.firebaseServiceAccount.startsWith("{")) {
  throw new Error("firebaseServiceAccount should be a JSON string")
}

if (!process.env.payloadUrl || !process.env.payloadUrl.startsWith("https")) {
  throw new Error("githubWebhookPayload env missing or not a URL")
}

const serviceAccount = JSON.parse(process.env.firebaseServiceAccount)
const url = process.env.payloadUrl

const credential = admin.credential.cert(serviceAccount as ServiceAccount)
admin.initializeApp({credential})
const firestore = admin.firestore()

firestore.settings({ ignoreUndefinedProperties: true })

export const importSpeakers = (data: any) => {
  const speakers: { [key: string]: object } = data.speakers
  if (!Object.keys(speakers).length) {
    return Promise.resolve()
  }
  console.log('Importing', Object.keys(speakers).length, 'speakers...')
  const batch = firestore.batch()
  Object.keys(speakers).forEach((speakerId, order) => {
    batch.set(firestore.collection('speakers').doc(speakerId), {
      ...speakers[speakerId],
      order,
    })
  })

  return batch.commit().then((results) => {
    console.log('Imported data for', results.length, 'speakers')
  })
}
export const importSessions = (data: any) => {
  const docs: { [key: string]: object } = data.sessions
  if (!Object.keys(docs).length) {
    return Promise.resolve()
  }
  console.log('Importing sessions...')
  const batch = firestore.batch()
  Object.keys(docs).forEach((docId) => {
    batch.set(firestore.collection('sessions').doc(docId), docs[docId])
  })
  return batch.commit().then((results) => {
    console.log('Imported data for', results.length, 'sessions')
  })
}
export const importSchedule = (data: any) => {
  const docs: { [key: string]: object } = data.schedule
  if (!Object.keys(docs).length) {
    return Promise.resolve()
  }
  console.log('Importing schedule...')
  const batch = firestore.batch()
  Object.keys(docs).forEach((docId) => {
    batch.set(firestore.collection('schedule').doc(docId), {
      ...docs[docId],
      date: docId,
    })
  })
  return batch.commit().then(() => {
    console.log('Imported data for', Object.keys(docs).length, 'days')
  })
}

async function deleteCollection(collectionPath: string, batchSize: number = 100) {
  const collectionRef = firestore.collection(collectionPath)
  const query = collectionRef.orderBy('__name__').limit(batchSize)

  return new Promise((resolve, reject) => {
    deleteQueryBatch(query, resolve).catch(reject)
  })
}

async function deleteQueryBatch(query: firestoreDep.Query, resolve: (value?: any) => any) {
  const snapshot = await query.get()

  const batchSize = snapshot.size
  if (batchSize === 0) {
    // When there are no documents left, we are done
    resolve()
    return
  }

  // Delete documents in a batch
  const batch = firestore.batch()
  snapshot.docs.forEach((doc: firestoreDep.QueryDocumentSnapshot) => {
    batch.delete(doc.ref)
  })
  await batch.commit()

  // Recurse on the next process tick, to avoid
  // exploding the stack.
  process.nextTick(() => {
    deleteQueryBatch(query, resolve)
  })
}

const cleanupScheduleSessionSpeakers = async () => {
  console.log('Cleaning up schedule sessions and speakers...')
  await deleteCollection('generatedSchedule')
  await deleteCollection('generatedSessions')
  await deleteCollection('generatedSpeakers')
  await deleteCollection('schedule')
  await deleteCollection('sessions')
  await deleteCollection('speakers')
  console.log('Cleanup done')
}

getSpeakersSessionsScheduleFromUrl(url)
  .then(async (data) => {
    await cleanupScheduleSessionSpeakers()
    await importSessions(data)
    await importSpeakers(data)
    await importSchedule(data)
  })
  .then(() => {
    console.log('Finished')
    process.exit()
  })
  .catch((err: Error) => {
    console.log(err)
    process.exit()
  })
