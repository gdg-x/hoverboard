import crypto from 'crypto';
// https://github.com/import-js/eslint-plugin-import/issues/1810

import * as logger from 'firebase-functions/logger';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import fetch from 'node-fetch';
import { fetchConfig } from '../db/config.js';

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
  const doc = await fetchConfig<MailchimpConfig>('mailchimp');
  return doc.exists ? (doc.data() as MailchimpConfig) : undefined;
};

// Retries are enabled so transient Mailchimp failures (thrown below) are re-attempted; a repeat
// subscribe is idempotent because an existing member is updated instead of duplicated.
export const mailchimpSubscribe = onDocumentCreated(
  { document: '/subscribers/{id}', retry: true },
  async (event) => {
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
  },
);

const isRetryableStatus = (status: number) => status === 429 || status >= 500;

async function subscribeToMailchimp(
  mailchimpConfig: MailchimpConfig,
  subscriberData: SubscriberPayload,
  emailHash?: string,
): Promise<void> {
  const uri = `https://${mailchimpConfig.dc}.api.mailchimp.com/3.0/lists/${mailchimpConfig.listid}/members`;
  const url = emailHash ? `${uri}/${emailHash}` : uri;
  const method = emailHash ? 'PATCH' : 'POST';

  // Network failures reject here and propagate so the invocation fails and is retried.
  const response = await fetch(url, {
    method,
    body: JSON.stringify(subscriberData),
    headers: {
      Authorization: `apiKey ${mailchimpConfig.apikey}`,
      'Content-Type': 'application/json',
    },
  });
  const body = (await response.json().catch(() => ({}))) as { title?: string; detail?: string };

  if (!response.ok) {
    if (!emailHash && response.status === 400 && body.title === 'Member Exists') {
      const hash = md5(subscriberData.email_address);
      return subscribeToMailchimp(mailchimpConfig, { ...subscriberData, status: 'pending' }, hash);
    }

    const message =
      `Mailchimp ${method} failed for ${subscriberData.email_address} with status ${response.status}: ${body.title ?? ''} ${body.detail ?? ''}`.trim();
    if (isRetryableStatus(response.status)) {
      throw new Error(message);
    }
    // Other 4xx responses (invalid email, bad credentials) will not succeed on retry.
    logger.error(message);
    return;
  }

  logger.log(
    method === 'POST'
      ? `${subscriberData.email_address} was added to subscribe list.`
      : `${subscriberData.email_address} was updated in subscribe list.`,
  );
}
