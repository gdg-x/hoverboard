
# Firestore Utils
At the moment Firestore admin panel doesn't allow to export/import data from their DB.
These scripts allow you to load data on your machine, edit and bring it back.
See examples to learn how it works.

#### Save collection/doc to file
```console
    npm run firestore:copy sourcePath fileToSave.json
```
###### Examples:
Save a collection
```console
    npm run firestore:copy partners/1/items general-partners.json
```
Save a document
```console
    npm run firestore:copy partners/1/items/000 gdg-lviv-partner.json
```

#### Load a file to collection/doc
```console
    npm run firestore:copy fileToLoad.json destinationPath
```
###### Examples:
Load to collection
```console
    npm run firestore:copy general-partners.json partners/1/items
```
Load a document
```console
    npm run firestore:copy gdg-lviv-partner.json partners/1/items/000
```

#### Copy collection->collection or doc->doc
```console
    npm run firestore:copy sourcePath destinationPath
```
###### Examples:
Copy a collection
```console
    npm run firestore:copy speakers backups/08-07-2018/speakers
```
Copy a document
```console
    npm run firestore:copy speakers/yonatan_levin backups/08-07-2018/speakers/yonatan_levin
```
