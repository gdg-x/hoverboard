import firebase from 'firebase';
// TODO: Remove type
declare global {
  interface Window {
    firebase: typeof firebase;
  }
}

export const db = () => {
  const db = window.firebase.firestore();

  return db;
};
