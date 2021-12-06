// https://github.com/import-js/eslint-plugin-import/issues/1810
// eslint-disable-next-line import/no-unresolved
import { getFirestore } from 'firebase-admin/firestore';
import * as functions from 'firebase-functions';
import md5 from 'md5';
import fetch from 'node-fetch';

const getMailchimpConfig = async () => {
  const doc = await getFirestore().collection('config').doc('mailchimp').get();
  return doc.exists && doc.data();
};

export const mailchimpSubscribe = functions.firestore
  .document('/subscribers/{id}')
  .onCreate(async (snapshot) => {
    const mailchimpConfig = await getMailchimpConfig();
    if (!mailchimpConfig) {
      console.log("Can't subscribe user, Mailchimp config is empty.");
    }

    const subscriber = snapshot.data();

    const subscriberData = {
      email_address: subscriber.email,
      status: 'subscribed',
      merge_fields: {
        FNAME: subscriber.firstName,
        LNAME: subscriber.lastName,
      },
    };

    return subscribeToMailchimp(mailchimpConfig, subscriberData);
  });

function subscribeToMailchimp(mailchimpConfig, subscriberData, emailHash?: string) {
  const uri = `https://${mailchimpConfig.dc}.api.mailchimp.com/3.0/lists/${mailchimpConfig.listid}/members`;
  const url = emailHash ? `${uri}/${emailHash}` : uri;
  const method = emailHash ? 'PATCH' : 'POST';

  const subscribePromise = fetch(url, {
    method,
    body: JSON.stringify(subscriberData),
    headers: {
      Authorization: `apiKey ${mailchimpConfig.apikey}`,
      'Content-Type': 'application/json',
    },
  });

  return subscribePromise
    .then((res) => res.json())
    .then(({ status, title }) => {
      if (status === 400 && title === 'Member Exists') {
        subscriberData.status = 'pending';
        const hash = md5(subscriberData.email_address);
        return subscribeToMailchimp(mailchimpConfig, subscriberData, hash);
      } else if (method === 'POST') {
        console.log(`${subscriberData.email_address} was added to subscribe list.`);
      } else if (method === 'PATCH') {
        console.log(`${subscriberData.email_address} was updated in subscribe list.`);
      }
    })
    .catch((error) => console.error(`Error occured during Mailchimp subscription: ${error}`));
}
