import {
    _closeConnection_,
    _deleteCollection_,
    _initConnection_, _retrieveCheapestItems_,
    _retrieveItems_, _retrieveItemsSorted_,
    _updateItems_,
    _updateItemWithObjectId_,
    _addItemsToCollection_,
    _addItemToCollection_,
    _addRankToItems_,
    _addUniqueIndex_,
    _createCollection_
} from "../db/db.js";
import {createRequire} from "module";

const require = createRequire(import.meta.url);
export const config = require("./config.json")
let client;
const dbName = config.mongo.dbs.collections;

///////////////////            DATABASE READ         ///////////////////

/**
 * @param {string} collectionKey - the collection name in the mongo db
 * @param {object} filter - e.g {token_id: "<token_id>"}
 * @param {number} limit - the max number of item to retrieve
 * @param {number} skip - the number of item to skip (i.e pagination)
 * @returns {Promise<[]>}
 */
export const retrieveItems = async (collectionKey, filter, limit = 10, skip = 0) => {
    return _retrieveItems_(client, dbName, collectionKey, filter, limit, skip);
}

/**
 * @param {string} collectionKey - the collection name in the mongo db
 * @param {object} filter - e.g {token_id: "<token_id>"}
 * @param {number} limit - the max number of item to retrieve
 * @param {{}} sort - e.g {score: 1} - 1 means ascending and -1 descending
 * @param {number} skip - the number of item to skip (i.e pagination)
 * @returns {Promise<[]>}
 */
export const retrieveItemsSorted = async (collectionKey, filter, limit = 10, sort, skip = 0) => {
    return _retrieveItemsSorted_(client, dbName, collectionKey, filter, limit, sort, skip);
}

/**
 * @param {string} collectionKey - the collection name in the mongo db
 * @param {object} filter - e.g {token_id: "<token_id>"}
 * @param {number} limit - the max number of item to retrieve
 * @param {number} skip - the number of item to skip (i.e pagination)
 * @returns {Promise<[]>}
 */
export const retrieveCheapestItems = async (collectionKey, filter = {}, limit = 10, skip = 0) => {
    return _retrieveCheapestItems_(client, dbName, collectionKey, filter, limit, skip)
}

///////////////////            DATABASE UPDATE         ///////////////////

/**
 * @param {string} collectionKey - the collection name in the mongo db
 * @param {string|ObjectId} id - the object id
 * @param {{}} newValues - e.g {name: "Mickey", address: "Canyon 123"}
 * @returns {Promise<boolean>} true if the item was updated - false otherwise
 */
export const updateItemWithObjectId = async (collectionKey, id, newValues) => {
    return _updateItemWithObjectId_(client, dbName, collectionKey, id, newValues)
}

/**
 * @param {string} collectionKey - the collection name in the mongo db
 * @param {{}} query - e.g { _id: ObjectId('61f68d54dd363a7674c9357f') }
 * @param {{}} newValues - e.g {name: "Mickey", address: "Canyon 123" }
 * @param {{}} unsetValues - e.g {name: "", address: "" }
 * @returns {Promise<boolean>}
 */
export const updateItem = async (collectionKey, query, newValues, unsetValues = {}) => {
    try {
        const newVal = {$set: newValues, $unset: unsetValues};
        const res = await client.db(getCollectionDBNameFromdbName(dbName)).collection(collectionKey).updateOne(query, newVal);
        return res.acknowledged;
    } catch (e) {
        return false;
    }
}

/**
 * @param {string} collectionKey - the collection name in the mongo db
 * @param {{}} query
 * @param {{}} newValues - e.g {name: "Mickey", address: "Canyon 123" }
 * @param {{}} unsetValues - e.g {name: "", address: "" }
 * @returns {Promise<boolean>}
 */
export const updateItems = async (collectionKey, query, newValues, unsetValues = {}) => {
    return _updateItems_(client, dbName, collectionKey, query, newValues, unsetValues);
}

/**
 * Order a list and add a rank field to each items
 * @param {string} collectionKey - the collection name in the mongo db
 * @param {{}} sort - e.g {rarity_score: 1} - 1 means ascending and -1 descending
 * @returns {Promise<Document>}
 */
export const addRankToItems = async (collectionKey, sort) => {
    return _addRankToItems_(client, dbName, collectionKey, sort);
}

///////////////////            DATABASE WRITE         ///////////////////

/**
 * @param {string} collectionKey - the collection name in the mongo db
 * @param {object} item
 * @returns {Promise<boolean>} true if the item was added - false otherwise
 */
export const addItemToCollection = async (collectionKey, item) => {
    return _addItemToCollection_(client, dbName, collectionKey, item);
}

/**
 *
 * @param {string} collectionKey - the collection name in the mongo db
 * @param {[]} items
 * @returns {Promise<boolean>} true if the item were added - false otherwise
 */
export const addItemsToCollection = async (collectionKey, items) => {
    return _addItemsToCollection_(client, dbName, collectionKey, items);
}

///////////////////             DATABASE MANAGEMENT         ///////////////////

/**
 * Init the client and the connection with the mongodb server
 * @returns {Promise<boolean>} - true if the connection is ok - false otherwise
 */
export const initConnection = async () => {
    const uri = config.mongo.uri;
    client = await _initConnection_(client, uri);
    return !!client;
}

/**
 * Close the connection with the mongodb server
 * @returns {Promise<boolean>} - true if the connection has been successfully closed - false otherwise
 */
export const closeConnection = async () => {
    return _closeConnection_(client);
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
    return _addUniqueIndex_(client, dbName, collectionKey, fieldParameter);
}

/**
 * Create a collection
 * @param {string} collectionKey - the collection name
 * @returns {Promise<boolean>} true if it succeeded - false otherwise
 */
export const createCollection = async (collectionKey) => {
    return _createCollection_(client, dbName, collectionKey);
}

/**
 * Delete a collection
 * @param {string} collectionKey - the collection name
 * @returns {Promise<boolean>} true if it succeeded - false otherwise
 */
export const deleteCollection = async (collectionKey) => {
    return _deleteCollection_(client, dbName, collectionKey);
}