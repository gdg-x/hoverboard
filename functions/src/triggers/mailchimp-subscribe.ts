import crypto from 'crypto';
// https://github.com/import-js/eslint-plugin-import/issues/1810

import { getFirestore } from 'firebase-admin/firestore';
import * as logger from 'firebase-functions/logger';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import fetch from 'node-fetch';

const md5 = (data: string) => crypto.createHash('md5').update(data).digest('hex');

interface MailchimpConfig {
  dc: string;
  listid: string;
  apikey: string;
}

interface SubscriberPayload {
  email_address: string;
  status: string;
  merge_fields: {
    FNAME?: string;
    LNAME?: string;
  };
}

const getMailchimpConfig = async (): Promise<MailchimpConfig | undefined> => {
  const doc = await getFirestore().collection('config').doc('mailchimp').get();
  return doc.exists ? (doc.data() as MailchimpConfig) : undefined;
};

export const mailchimpSubscribe = onDocumentCreated('/subscribers/{id}', async (event) => {
  const mailchimpConfig = await getMailchimpConfig();
  if (!mailchimpConfig) {
    logger.log("Can't subscribe user, Mailchimp config is empty.");
    return;
  }

  const subscriber = event.data?.data();
  if (!subscriber) return;

  const subscriberData: SubscriberPayload = {
    email_address: subscriber.email,
    status: 'subscribed',
    merge_fields: {
      FNAME: subscriber.firstName,
      LNAME: subscriber.lastName,
    },
  };

  return subscribeToMailchimp(mailchimpConfig, subscriberData);
});

function subscribeToMailchimp(
  mailchimpConfig: MailchimpConfig,
  subscriberData: SubscriberPayload,
  emailHash?: string,
): Promise<void> {
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
    .then((res) => res.json() as Promise<{ status?: number; title?: string }>)
    .then(({ status, title }) => {
      if (status === 400 && title === 'Member Exists') {
        subscriberData.status = 'pending';
        const hash = md5(subscriberData.email_address);
        return subscribeToMailchimp(mailchimpConfig, subscriberData, hash);
      } else if (method === 'POST') {
        logger.log(`${subscriberData.email_address} was added to subscribe list.`);
      } else if (method === 'PATCH') {
        logger.log(`${subscriberData.email_address} was updated in subscribe list.`);
      }
      return undefined;
    })
    .catch((error) => {
      logger.error(`Error occured during Mailchimp subscription: ${error}`);
    });
}
