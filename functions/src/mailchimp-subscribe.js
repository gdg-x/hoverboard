import * as functions from 'firebase-functions';
import request from 'request';
import md5 from 'md5';

export const mailchimpSubscribe = functions.database.ref('/subscribers/{id}')
    .onCreate(async (event) => {

        const mailchimpConfig = functions.config().mailchimp;
        if (!mailchimpConfig) {
            console.log('Can\'t subscribe user, Mailchimp config is empty.');
        }

        const id = event.params.id;
        const subscriber = event.data.val();

        const subscriberData = {
            email_address: subscriber.email,
            status: 'subscribed',
            merge_fields: {
                FNAME: subscriber.firstName,
                LNAME: subscriber.lastName
            }
        };

        return subscribeToMailchimp('POST', mailchimpConfig, subscriberData, (bodyObj) => {
            if (bodyObj.status === 400 & bodyObj.title === 'Member Exists') {
                subscriberData.status = 'pending';
                const hash = md5(subscriberData.email_address);

                return subscribeToMailchimp('PATCH', mailchimpConfig, subscriberData, (bodyObj) => {
                    console.log(`${bodyObj.email_address} was updated to subscribe list.`);
                }, hash);
            }
            else {
                console.log(`${bodyObj.email_address} was added to subscribe list.`);
            }
        });
    });

function subscribeToMailchimp(method, mailchimpConfig, subscriberData, clbk, emailHash) {
    const uri = `https://${mailchimpConfig.dc}.api.mailchimp.com/3.0/lists/${mailchimpConfig.listid}/members`;
    const url = emailHash ? `${uri}/${emailHash}` : uri;

    return request({
        method: method,
        url: url,
        body: JSON.stringify(subscriberData),
        headers: {
            'Authorization': `apiKey ${mailchimpConfig.apikey}`,
            'Content-Type': 'application/json'
        }
    },
    (error, response, body) => {
        if (error) {
            console.log(`Error occured during Mailchimp subscription: ${error}`);
        } else {
            var bodyObj = JSON.parse(body);
            clbk(bodyObj);
        }
    });
}
