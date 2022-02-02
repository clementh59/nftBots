import fetch from 'node-fetch';
import {
    addItemToCollection, addRankToItems, addUniqueIndex,
    closeConnection,
    initConnection, updateItems, addItemsToCollection
} from "../terraDB.js";
import {createRequire} from "module";

const require = createRequire(import.meta.url);
const config = require("../config.json")

// config
const jsonFile = './gbac.json';
const itemName = 'gbac';
const contract = config.contracts.galaxy_baby_ape_club;
const possibleAttributes = [
    "Skins",
    "Lazers",
    "Clothes",
    "Eyewear",
    "Helmets",
    "Weapons",
    "Background",
    "Mouthwear",
];
// end config

const _coll = (require(jsonFile)).data;
const _collNumber = (require(jsonFile)).length;

const coll = [];

const formatAttribute = (traitType, value) => {
    return {
        'trait_type': traitType,
        'value': value
    }
}

const getAttributes = (lb) => {
    const att = [];

    possibleAttributes.forEach((i) => {
        if (lb[i])
            att.push(formatAttribute(i.toLowerCase(), lb[i]))
    });

    return att;
}

const formatAndAdd = (lb) => {
    const item = {
        token_id: lb.slug.substring(lb.slug.indexOf('_') + 1, lb.slug.length),
        image: lb.img,
        rarity_score: lb.rare_score,
        rank: lb.rank,
        order: config.constants.order.NONE,
        history: [],
        attributes: getAttributes(lb),
        name: `${itemName} #${lb.id}`
    }
    coll.push(item);
    return item;
}

const retrieveAllCollectionAndAddItToDb = async () => {
    await initConnection();
    await addUniqueIndex(contract, {'token_id': 1});
    for (let i = 0; i < _collNumber; i++) {
        try {
            formatAndAdd(_coll[i]);
        } catch (e) {
            console.log(i);
        }
    }
    await addItemsToCollection(contract, coll);
    await closeConnection();
}

const checkIfDataIsOk = () => {
    console.log(formatAndAdd(_coll[5]));
}

const updateAllItems = async () => {
    await initConnection();
    await updateItems(contract, {}, {}, {rarity_score: ''});
    await closeConnection();
}

checkIfDataIsOk();
//retrieveAllCollectionAndAddItToDb();