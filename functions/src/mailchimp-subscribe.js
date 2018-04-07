import * as functions from 'firebase-functions';
import md5 from 'md5';
import fetch from 'node-fetch';

const mailchimpSubscribe = functions.database.ref('/subscribers/{id}')
  .onCreate(async (snapshot) => {

    const mailchimpConfig = functions.config().mailchimp;
    if (!mailchimpConfig) {
      console.log('Can\'t subscribe user, Mailchimp config is empty.');
    }

    const subscriber = snapshot.val();

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

function subscribeToMailchimp(mailchimpConfig, subscriberData, emailHash) {
  const uri = `https://${mailchimpConfig.dc}.api.mailchimp.com/3.0/lists/${mailchimpConfig.listid}/members`;
  const url = emailHash ? `${uri}/${emailHash}` : uri;
  const method = emailHash ? 'PATCH' : 'POST';

  const subscribePromise = fetch(url, {
    method,
    body: JSON.stringify(subscriberData),
    headers: {
      'Authorization': `apiKey ${mailchimpConfig.apikey}`,
      'Content-Type': 'application/json',
    },
  });

  subscribePromise
    .then((res) => res.json())
    .then(({ status, title }) => {
      if (status === 400 && title === 'Member Exists') {
        subscriberData.status = 'pending';
        const hash = md5(subscriberData.email_address);
        return subscribeToMailchimp(mailchimpConfig, subscriberData, hash);
      } else if(method === 'POST') {
        console.log(`${subscriberData.email_address} was added to subscribe list.`);
      } else if(method === 'PATCH') {
        console.log(`${subscriberData.email_address} was updated in subscribe list.`);
      }
    })
    .catch((error) => console.log(`Error occured during Mailchimp subscription: ${error}`));

  return subscribePromise;
}

export default mailchimpSubscribe;
