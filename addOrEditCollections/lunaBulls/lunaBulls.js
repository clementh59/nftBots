import fetch from 'node-fetch';
import {
    addItemToCollection, addRankToItems, addUniqueIndex,
    closeConnection,
    initConnection, updateItems,
} from "../terraDB.js";
import {createRequire} from "module";
import {addItemsToCollection} from "../terraDB.js";

const require = createRequire(import.meta.url);
const config = require("../config.json")
const _lbs = require("./lunaBulls.json")

const lbs = [];

const contract = config.contracts.luna_bulls;

const getLunaBull = async (number) => {
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

const addLBToDB = async (number) => {
    const lb = await getLunaBull(number);
}

const formatAttribute = (traitType, value) => {
    return {
        'trait_type': traitType,
        'value': value
    }
}

const getAttributes = (lb) => {
    const att = [];
    const possibleAttributes = [
        'Body', 'Background', 'Eyes', 'Headwear', 'Horns', 'Nose', 'Nosepiece', 'Outfit'
    ]

    possibleAttributes.forEach((i) => {
        if (lb[i])
            att.push(formatAttribute(i.toLowerCase(), lb[i]))
    });

    return att;
}

const formatAndAdd = (lb) => {
    const item = {
        token_id: lb.slug.substring(lb.slug.indexOf('_')+1,lb.slug.length),
        image: lb.img,
        rarity_score: lb.rare_score,
        rank: lb.rank,
        order: config.constants.order.NONE,
        history: [],
        attributes: getAttributes(lb),
        name: `LunaBull #${lb.id}`
    }
    lbs.push(item);
    return item;
}

const retrieveAllLBAndAddThemToDb = async () => {
    await initConnection();
    //await addUniqueIndex(contract, {'token_id': 1});
    for (let i = 0; i < 10069; i++) {
        try {
            formatAndAdd(_lbs.lunaBulls[i]);
        } catch (e) {
            console.log(i);
        }
    }
    await addItemsToCollection(contract, lbs);
    await closeConnection();
}


/*const updateAllItems = async () => {
    await initConnection();
    await updateItems(contract, {}, {history: []});
    await closeConnection();
}*/

retrieveAllLBAndAddThemToDb();
