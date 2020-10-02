import fs from 'fs';
import path from 'path';
import { firestore } from './firebase-config';

const FILE_EXTENSION_PATTERN = /\.([0-9a-z]+)(?=[?#])|(\.)(?:[\w]+)$/gim;

export function getData(path: string): Promise<object> {
  const source = getPathObject(path);
  if ('file' in source) {
    return fetchDataFromFile(source.file);
  }
  return fetchDataFromFirestore(source.collection, source.doc);
}

export function saveData(data: object, path: string) {
  const destination = getPathObject(path);
  if ('file' in destination) {
    return saveDataToFile(data, destination.file);
  }
  return saveDataToFirestore(data, destination.collection, destination.doc);
}

function fetchDataFromFile(file: string): Promise<object> {
  return new Promise((resolve, reject) => {
    fs.readFile(path.resolve(process.cwd(), file), 'utf8', (err, data) => {
      if (err) reject(err);
      resolve(JSON.parse(data));
    });
  });
}

function saveDataToFile(data: object, file: string) {
  return new Promise((resolve, reject) => {
    fs.writeFile(path.resolve(process.cwd(), file), JSON.stringify(data, null, 2), (err) => {
      if (err) reject(err);
      resolve(data);
    });
  });
}

function fetchDataFromFirestore(collection: string, doc?: string): Promise<object> {
  if (!doc) {
    return firestore
      .collection(collection)
      .get()
      .then((snapshot) => {
        const collectionData: { [key: string]: object } = {};
        snapshot.forEach((doc) => {
          collectionData[doc.id] = doc.data();
        });
        return Promise.resolve(collectionData);
      });
  }
  return firestore
    .collection(collection)
    .doc(doc)
    .get()
    .then((document) => document.data() as object);
}

function saveDataToFirestore(data: object, collection: string, doc?: string) {
  if (!doc) {
    const batch = firestore.batch();
    Object.entries(data).forEach(([key, value]) => {
      const docRef = firestore.collection(collection).doc(key);
      batch.set(docRef, value);
    });
    return batch.commit();
  }
  return firestore.collection(collection).doc(doc).set(data);
}

interface File {
  file: string;
}

interface Doc {
  collection: string;
  doc?: string;
}

type PathObject = File | Doc;

function getPathObject(path: string): PathObject {
  const normalizedParams = path.replace(/\/$/, '');
  const paramsExtension = normalizedParams.match(FILE_EXTENSION_PATTERN);

  if (paramsExtension && paramsExtension[0]) {
    return {
      file: normalizedParams,
    };
  } else if (normalizedParams.split('/').length % 2 !== 0) {
    return {
      collection: normalizedParams,
    };
  }
  return {
    collection: normalizedParams.slice(0, normalizedParams.lastIndexOf('/')),
    doc: normalizedParams.slice(normalizedParams.lastIndexOf('/') + 1),
  };
}
