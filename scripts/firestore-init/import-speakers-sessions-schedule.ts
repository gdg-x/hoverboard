// @ts-nocheck
import admin, { firestore as firestoreDep, ServiceAccount } from 'firebase-admin'
import fs from "fs"

if (!process.env.firebaseServiceAccount) {
  throw new Error("firebaseServiceAccount is not defined")
}
if (!process.env.firebaseServiceAccount.startsWith("{")) {
  throw new Error("firebaseServiceAccount should be a JSON string")
}

const serviceAccount = JSON.parse(process.env.firebaseServiceAccount)

const credential = admin.credential.cert(serviceAccount as ServiceAccount)
admin.initializeApp({ credential })
const firestore = admin.firestore()

const fileName = `${__dirname}/../../docs/sessions-speakers-schedule.json`
const rawFileContent = fs.readFileSync(fileName, 'utf8')
const fileContent = JSON.parse(rawFileContent)

// Duplicate of index.ts to import only the speakers, sessions and schedule from a GitHub Action

export const importSpeakers = () => {
  const speakers: { [key: string]: object } = fileContent.speakers
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
export const importSessions = () => {
  const docs: { [key: string]: object } = fileContent.sessions
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
export const importSchedule = () => {
  const docs: { [key: string]: object } = fileContent.schedule
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

cleanupScheduleSessionSpeakers()
.then(() => importSessions())
.then(() => importSpeakers())
.then(() => importSchedule())
.then(() => {
  console.log('Finished')
  process.exit()
})
.catch((err: Error) => {
  console.log(err)
  process.exit()
})
