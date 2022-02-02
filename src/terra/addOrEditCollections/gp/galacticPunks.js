import fetch from 'node-fetch';
import {
    addItemToCollection, addRankToItems,
    closeConnection,
    initConnection, updateItems,
} from "../terraDB.js";
import {createRequire} from "module";
const require = createRequire(import.meta.url);
const config = require("../config.json")

const contract = config.contracts.galactic_punks;

const getGP = async (number) => {
    const res = await fetch(`https://galacticpunks.io/assets/punk-metadata/${number}.json`, {
        "headers": {},
        "body": null,
        "method": "GET"
    });

    let json = await res.json();
    delete json.extension.description;

    json = {...json, ...json.extension}
    delete json.extension;
    return json;
}

const addGpToDB = async (number) => {
    const gp = await getGP(number);
    await addItemToCollection(contract, gp);
}

const retrieveAllGPAndAddThemToDb = async () => {
    await initConnection();
    for (let i = 1; i <= 10921; i++) {
        try {
            await addGpToDB(i)
        } catch (e) {
            console.log(i);
        }
    }
    await closeConnection();
}

const addRankToEachGP = async () => {
    await initConnection();
    await addRankToItems(contract, {'rarity_score': -1});
    await closeConnection();
}

const updateAllItems = async () => {
    await initConnection();
    await updateItems(contract, {}, {history: []});
    await closeConnection();
}