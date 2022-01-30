import {MongoClient, ObjectId} from 'mongodb'
import {createRequire} from "module";

const require = createRequire(import.meta.url);
export const config = require("../config.json")

const uri = config.mongo.uri;
const dbs = config.mongo.dbs;

let client;

///////////////////            DATABASE READ         ///////////////////

/**
 *
 * @param {string} collectionKey - the collection name in the mongo db
 * @param {object} filter - e.g {token_id: "<token_id>"}
 * @param {number} limit - the max number of item to retrieve
 * @param {number} skip - the number of item to skip (i.e pagination)
 * @returns {Promise<[]>}
 */
export const retrieveItems = async (collectionKey, filter, limit = 10, skip = 0) => {
    return client.db(dbs.collections).collection(collectionKey).find(filter).skip(skip).limit(limit).toArray();
}

/**
 *
 * @param {string} collectionKey - the collection name in the mongo db
 * @param {object} filter - e.g {token_id: "<token_id>"}
 * @param {number} limit - the max number of item to retrieve
 * @param {{}} sort - e.g {score: 1} - 1 means ascending and -1 descending
 * @param {number} skip - the number of item to skip (i.e pagination)
 * @returns {Promise<[]>}
 */
export const retrieveItemsSorted = async (collectionKey, filter, limit = 10, sort, skip = 0) => {
    return client.db(dbs.collections).collection(collectionKey).find(filter).sort(sort).skip(skip).limit(limit).toArray();
}

/**
 *
 * @param {string} collectionKey - the collection name in the mongo db
 * @param {object} filter - e.g {token_id: "<token_id>"}
 * @param {number} limit - the max number of item to retrieve
 * @param {number} skip - the number of item to skip (i.e pagination)
 * @returns {Promise<[]>}
 */
export const retrieveCheapestItems = async (collectionKey, filter = {}, limit = 10, skip = 0) => {
    const _filter = {
        price : { $exists: true, $ne: null },
        ...filter
    }
    return client.db(dbs.collections).collection(collectionKey).find(_filter).sort({price: 1}).skip(skip).limit(limit).toArray();
}

///////////////////            DATABASE UPDATE         ///////////////////

/**
 *
 * @param {string} collectionKey - the collection name in the mongo db
 * @param {string|ObjectId} id - the object id
 * @param {{}} newValues - e.g {name: "Mickey", address: "Canyon 123"}
 * @returns {Promise<boolean>} true if the item was updated - false otherwise
 */
export const updateItemWithObjectId = async (collectionKey, id, newValues) => {
    let query;

    if (typeof id === 'string')
        query = { _id: ObjectId(id) };
    else
        query = {_id: id};

    return updateItem(collectionKey, query, newValues)
}

/**
 *
 * @param {string} collectionKey - the collection name in the mongo db
 * @param {{}} query - e.g { _id: ObjectId('61f68d54dd363a7674c9357f') }
 * @param {{}} newValues - e.g {name: "Mickey", address: "Canyon 123" }
 * @param {{}} unsetValues - e.g {name: "", address: "" }
 * @returns {Promise<boolean>}
 */
export const updateItem = async (collectionKey, query, newValues, unsetValues = {}) => {
    try {
        const newVal = {$set: newValues, $unset: unsetValues};
        const res = await client.db(dbs.collections).collection(collectionKey).updateOne(query, newVal);
        return res.acknowledged;
    } catch (e) {
        return false;
    }
}

/**
 *
 * @param {string} collectionKey - the collection name in the mongo db
 * @param {{}} query
 * @param {{}} newValues - e.g {name: "Mickey", address: "Canyon 123" }
 * @returns {Promise<boolean>}
 */
export const updateItems = async (collectionKey, query, newValues) => {
    try {
        const newVal = {$set: newValues};
        const res = await client.db(dbs.collections).collection(collectionKey).updateMany(query, newVal);
        return res.acknowledged;
    } catch (e) {
        return false;
    }
}

/**
 * Order a list and add a rank field to each items
 * @param {string} collectionKey - the collection name in the mongo db
 * @param {{}} sort - e.g {rarity_score: 1} - 1 means ascending and -1 descending
 * @returns {Promise<Document>}
 */
export const addRankToItems = async (collectionKey, sort) => {

    let items = [];
    let skip = 0;
    let rank = 1;

    do {
        items = await retrieveItemsSorted(collectionKey, {}, 50, sort, skip);
        for (let i = 0; i < items.length; i++) {
            await updateItemWithObjectId(collectionKey, items[i]._id, {rank: rank++});
        }
        skip+=items.length;
    } while (items.length > 0)
}

///////////////////            DATABASE WRITE         ///////////////////

/**
 *
 * @param {string} collectionKey - the collection name in the mongo db
 * @param {object} item
 * @returns {Promise<boolean>} true if the item was added - false otherwise
 */
export const addItemToCollection = async (collectionKey, item) => {
    try {
        const res = await client.db(dbs.collections).collection(collectionKey).insertOne(item);
        return res.acknowledged;
    } catch (e) {
        return false;
    }
}

/**
 *
 * @param {string} collectionKey - the collection name in the mongo db
 * @param {[]} items
 * @returns {Promise<boolean>} true if the item were added - false otherwise
 */
export const addItemsToCollection = async (collectionKey, items) => {
    try {
        const res = await client.db(dbs.collections).collection(collectionKey).insertMany(items);
        return res.acknowledged;
    } catch (e) {
        return false;
    }
}

///////////////////             DATABASE MANAGEMENT         ///////////////////

/**
 * Init the connection with the mongodb server
 * @returns {Promise<boolean>} - true if the connection is ok - false otherwise
 */
export const initConnection = async () => {
    client = new MongoClient(uri);
    try {
        await client.connect();
        return true
    } catch (e) {
        return false;
    }
}

/**
 * Init the connection with the mongodb server
 * @returns {Promise<boolean>} - true if the connection has been successfully closed - false otherwise
 */
export const closeConnection = async () => {
    try {
        await client.close();
        return true
    } catch (e) {
        return false;
    }
}

/**
 *
 * Add a unique index in the given collection.
 * e.g: await addUniqueIndex(collectionKey, {'token_id': 1});
 *
 * @param {string} collectionKey - the collection name
 * @param {object} fieldParameter - the field that needs to be unique & the sort condition. eg {fieldName: 1}
 * @returns {Promise<boolean>} true if it succeeded - false otherwise
 */
export const addUniqueIndex = async (collectionKey, fieldParameter) => {
    try {
        const res = await client.db(dbs.collections).collection(collectionKey).createIndex(fieldParameter, {unique: true});
        return res.toString().endsWith('_1');
    } catch (e) {
        return false;
    }
}

/**
 * Create a collection
 *
 * @param {string} collectionKey - the collection name
 * @returns {Promise<boolean>} true if it succeeded - false otherwise
 */
export const createCollection = async (collectionKey) => {
    try {
        await client.db(dbs.collections).createCollection(collectionKey);
        return true;
    } catch (e) {
        return false;
    }
}

/**
 * Delete a collection
 *
 * @param {string} collectionKey - the collection name
 * @returns {Promise<boolean>} true if it succeeded - false otherwise
 */
export const deleteCollection = async (collectionKey) => {
    try {
        await client.db(dbs.collections).collection(collectionKey).drop();
        return true;
    } catch (e) {
        return false;
    }
}