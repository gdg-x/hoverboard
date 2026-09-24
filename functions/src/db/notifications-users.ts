import { DocumentData, DocumentSnapshot, getFirestore } from 'firebase-admin/firestore';

export const fetchNotificationsUser = (id: string): Promise<DocumentSnapshot<DocumentData>> => {
  return getFirestore().collection('notificationsUsers').doc(id).get();
};

export const removeUserTokens = (tokensToUsers: Record<string, string>): Promise<unknown[]> => {
  const userTokens = Object.keys(tokensToUsers).reduce((acc: Record<string, string[]>, token) => {
    const userId = tokensToUsers[token];
    if (!userId) return acc;
    const existingTokens = acc[userId] || [];

    return { ...acc, [userId]: [...existingTokens, token] };
  }, {});

  const promises = Object.keys(userTokens).map((userId) => {
    const ref = getFirestore().collection('notificationsUsers').doc(userId);

    return getFirestore().runTransaction((transaction) =>
      transaction.get(ref).then((doc) => {
        if (!doc.exists) {
          return;
        }

        const val = doc.data() || {};
        const newVal = Object.keys(val).reduce((acc: Record<string, boolean>, token) => {
          if (tokensToUsers[token]) return acc;

          return { ...acc, [token]: true };
        }, {});

        transaction.set(ref, newVal);
      }),
    );
  });

  return Promise.all(promises);
};
