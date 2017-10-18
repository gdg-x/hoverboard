const fs = require('fs');

const originalJSON = JSON.parse(fs.readFileSync('default-firabase-data.json'));

Object.keys(originalJSON).forEach(key => fs.writeFileSync(`${key}.json`, JSON.stringify(originalJSON[key])));
