// TODO: Remove type
declare global {
  interface Window {
    firebase: typeof import('firebase');
  }
}

export const db = () => {
  const db = window.firebase.firestore();

  if (location.hostname === 'localhost') {
    db.settings({
      host: 'localhost:8080',
      ssl: false,
    });
  }

  return db;
};
