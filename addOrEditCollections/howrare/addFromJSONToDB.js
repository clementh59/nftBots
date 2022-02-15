import {createRequire} from "module";
import {closeConnection, initConnection, renameCollection, upsertItem} from "../../src/terra/terraDB.js";

const require = createRequire(import.meta.url);

// variables
const json = require('./styllar.json');
const contract = 'terra1934kn7p03ns94htl75zpzsg0n4yvw8yf2746ep';
const newCollectionName = 'styllar';
// end variables

(async () => {
    /*console.log(json.items.find(i => i.token_id === '7781'));
    console.log(json.items.length);*/


    await initConnection();
    /*const promises = [];
    for (let i = 0; i < json.items.length; i++) {
        json.items[i].rank = parseInt(json.items[i].rank);
        promises.push(upsertItem(contract, {token_id: json.items[i].token_id}, json.items[i]));
    }
    await Promise.all(promises);
    await renameCollection(contract, newCollectionName);*/
    await closeConnection();
    process.exit(0);
})();