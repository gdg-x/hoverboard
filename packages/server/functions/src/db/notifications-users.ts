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
    const tokensToRemove = new Set(userTokens[userId]);

    return getFirestore().runTransaction((transaction) =>
      transaction.get(ref).then((doc) => {
        if (!doc.exists) {
          return;
        }

        const { tokens = {} } = (doc.data() || {}) as { tokens?: Record<string, true> };
        const remainingTokens = Object.keys(tokens).reduce<Record<string, true>>(
          (acc, token) => (tokensToRemove.has(token) ? acc : { ...acc, [token]: true as const }),
          {},
        );

        transaction.set(ref, { tokens: remainingTokens });
      }),
    );
  });

  return Promise.all(promises);
};
