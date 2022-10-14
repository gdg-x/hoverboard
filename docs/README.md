# Docs

## Tutorials

- [Set up](tutorials/00-set-up.md)
- [Configure](tutorials/01-configure-app.md)
- [Firebase Configuration](tutorials/02-firebase.md)
- [Styling](tutorials/03-styling.md)
- [Deploy](tutorials/04-deploy.md)
- [Notifications](tutorials/05-notifications.md)
- [SEO](tutorials/06-seo.md)
- [MailChimp auto subscription](tutorials/07-mailchimp-autosubscribe.md)

```bash
# Instalar las dependencias
npm ci
# Instalar firebase
npm install -g firebase-tools
# login
npx firebase login
npx firebase use devfest2022dev
# Borrar las colecciones
npx firebase firestore:delete --recursive --all-collections
# Subir los datos que se modificaron
npm run firestore:init
# Ejecutar en local
npm start
# Deploy a firebase para que se suban los datos que se cambiaron
npm run deploy
````
