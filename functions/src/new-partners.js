import * as functions from 'firebase-functions';
import fetch from 'node-fetch';

const newPotentialPartner = functions.firestore.document('/potentialPartners/{id}')
  .onCreate((snapshot) => {

    const slackConfig = functions.config().slack;
    if (!slackConfig) {
      console.log('Can\'t send potential partner to webhook, slack config is empty.');
    }

    const partner = snapshot.data();
    const url = slackConfig.newpartnerurl;

    const slackContent = {
      text: "Nouvelle demande de sponsoring 🎉",
      attachments: [
        {
            fallback: `Nouvelle demande de sponsoring de ${partner.fullName} (${partner.email}) - ${partner.companyName}`,
            fields: [
                {
                    title: "Nom 🧑",
                    value: partner.fullName,
                    short: true
                },
                {
                    title: "Email 📧",
                    value: partner.email,
                    short: true
                },
                {
                    title: "Entreprise 🏢",
                    value: partner.companyName,
                    short: true
                }
            ],
            color: "#e83002"
        },
        {
          title: `Envoyer un email en cliquant ici`,
          title_link: `mailto:${partner.email}?Subject=Demande%20de%20sponsoring%20Sunny%20Tech`
        }
      ]
    };


    const postPromise = fetch(url, {
      method: 'POST',
      body: JSON.stringify(slackContent),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return postPromise
              .then((res) => {if(res.status > 399) console.log(res)})
              .catch((error) => console.error(`Error occured during Slack event: ${error}`));
});

export default newPotentialPartner;
