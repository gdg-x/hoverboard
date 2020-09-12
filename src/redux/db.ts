// TODO: Remove type
declare global {
  interface Window {
    firebase: typeof import('firebase');
  }
}

export const db = () => {
  const db = window.firebase.firestore();

  return db;
};
