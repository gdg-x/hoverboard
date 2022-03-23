import fs from 'fs';
import path from 'path';
import { firestore } from '../firebase-config';

interface Document {
  [key: string]: unknown;
}

interface Collection {
  [id: string]: Document;
}

type Data = Document | Collection;

interface PathObject {
  file?: string;
  collection?: string;
  doc?: string;
}

// TODO: Describe what this pattern does
const FILE_EXTENSION_PATTERN = /\.([0-9a-z]+)(?=[?#])|(\.)(?:[\w]+)$/gim;

export async function getData(path: string): Promise<Data> {
  const { file, collection, doc } = getPathObject(path);
  if (file) {
    return fetchDataFromFile(file);
  } else if (collection && doc) {
    return getDocument(collection, doc);
  } else if (collection) {
    return getCollection(collection);
  } else {
    throw new Error('Not a valid source');
  }
}

export async function saveData(data: Data, path: string): Promise<void> {
  const { file, collection, doc } = getPathObject(path);
  if (file) {
    await saveDataToFile(data, file);
  } else if (collection && doc) {
    return setDocument(data, collection, doc);
  } else if (collection) {
    return setCollection(data, collection);
  } else {
    throw new Error('Not a valid destination');
  }
}

async function fetchDataFromFile(file: string): Promise<Data> {
  const contents = await fs.promises.readFile(path.resolve(process.cwd(), file), 'utf8');
  return JSON.parse(contents);
}

async function saveDataToFile(data: object, file: string) {
  await fs.promises.writeFile(path.resolve(process.cwd(), file), JSON.stringify(data, null, 2));
}

async function getDocument(collectionId: string, docId: string): Promise<Document> {
  const document = await firestore.collection(collectionId).doc(docId).get();
  if (document.exists) {
    return document.data() as Document;
  }
  throw new Error(`Document ${collectionId}/${docId} not found.`);
}

async function getCollection(collectionId: string): Promise<Collection> {
  const snapshot = await firestore.collection(collectionId).get();
  const collection: Collection = {};
  snapshot.forEach((doc) => (collection[doc.id] = doc.data() as Document));
  return collection;
}

async function setDocument(data: Data, collectionId: string, documentId: string) {
  await firestore.collection(collectionId).doc(documentId).set(data);
}

async function setCollection(data: Data, collectionId: string) {
  const batch = firestore.batch();
  Object.entries(data).forEach(([documentId, document]) => {
    const docRef = firestore.collection(collectionId).doc(documentId);
    batch.set(docRef, document);
  });
  await batch.commit();
}

function getPathObject(path: string) {
  const normalizedParams = path.replace(/\/$/, '');
  const paramsExtension = normalizedParams.match(FILE_EXTENSION_PATTERN);
  const pathObject: Partial<PathObject> = {};

  if (paramsExtension && paramsExtension[0]) {
    pathObject.file = normalizedParams;
  } else if (normalizedParams.split('/').length % 2 !== 0) {
    pathObject.collection = normalizedParams;
  } else {
    pathObject.collection = normalizedParams.slice(0, normalizedParams.lastIndexOf('/'));
    pathObject.doc = normalizedParams.slice(normalizedParams.lastIndexOf('/') + 1);
  }

  return pathObject;
}
