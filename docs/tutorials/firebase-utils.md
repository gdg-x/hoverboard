
# Firestore Utils
At the moment Firestore admin panel doesn't allow to export/import data from their DB.
These scripts allows you to load data on your machine, edit and bring it back. 
See examples to learn how it works.

#### Save collection/doc to file
```console
    yarn firestore:copy sourcePath fileToSave.json
```
###### Examples:
Save a collection
```console
    yarn firestore:copy partners/1/items general-partners.json
```
Save a document
```console
    yarn firestore:copy partners/1/items/000 gdg-lviv-partner.json
```

#### Load a file to collection/doc 
```console
    yarn firestore:copy fileToLoad.json destinationPath
```
###### Examples:
Load to collection
```console
    yarn firestore:copy general-partners.json partners/1/items
```
Load a document
```console
    yarn firestore:copy gdg-lviv-partner.json partners/1/items/000
```

#### Copy collection->collection or doc->doc
```console
    yarn firestore:copy sourcePath destinationPath
```
###### Examples:
Copy a collection
```console
    yarn firestore:copy speakers backups/08-07-2018/speakers
```
Copy a document
```console
    yarn firestore:copy speakers/yonatan_levin backups/08-07-2018/speakers/yonatan_levin
```
