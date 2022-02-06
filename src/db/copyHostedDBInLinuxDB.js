import {getCollectionsName, initConnection, retrieveItems} from '../terra/terraDB.js';
import {_addItemsToCollection_, _addUniqueIndex_, _initConnection_} from "./db.js";

let client;
const uri = 'mongodb://192.168.1.29:27017';

const copyCollection = async (name) => {
    let items = [];
    let skip = 0;
    let all = [];

    console.log('copying '+name);
    // await _addUniqueIndex_(client, 'terra', name, {'token_id': 1});

    do {
        items = await retrieveItems(name, {}, 100, skip);
        all.push(...items);
        skip+=100;
    } while (items.length === 100);

    console.log(all.length)
    await _addItemsToCollection_(client, 'terra', name, all);
}

const copyDB = async () => {
    await initConnection();
    client = await _initConnection_(client, uri);
    const res = await getCollectionsName();
    console.log(res.length)
    let promises = [];
    console.log('starting')
    promises.push(copyCollection('galactic_punks'));
    promises.push(copyCollection('terrabots'));
    await Promise.all(promises);
    console.log('finish')
}

copyDB();