# firebase firestore:delete -r --all-collections -y && firebase functions:config:set schedule.enabled=true && firebase deploy --except hosting && babel-node ./internals/import-default-data
npm run firestore:init
npm run build
npm run deploy