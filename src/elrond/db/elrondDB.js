import {
    _addHistoryEntryToItem_,
    _addItemsToCollection_,
    _addItemToCollection_,
    _addRankToItems_,
    _addUniqueIndex_,
    _closeConnection_,
    _createCollection_,
    _deleteCollection_,
    _deleteItem_,
    _getCollectionsName_,
    _initConnection_,
    _retrieveCheapestItems_,
    _retrieveCheapestItemsUnderRank_,
    _retrieveCheapestItemsWithSpecialTrait_,
    _retrieveItems_,
    _retrieveItemsSorted_,
    _updateItem_,
    _updateItems_,
    _updateItemWithObjectId_,
    _upsertItem_
} from "../../db/db.js";
import {createRequire} from "module";
import {rates} from "../services/priceRateService.js";

const require = createRequire(import.meta.url);
export const config = require("../config.json");
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

export const retrieveCheapestItemsIncludingAllCurrencies = async (collectionKey, limit = 10, skip = 0) => {

    const cheapestItemsInEGLD = (await retrieveCheapestItems(collectionKey, {
        currency: 'EGLD'
    }, limit, skip))?.map((i) => {
        return {
            ...i,
            priceInEGLD: i.price
        }
    });
    const cheapestItemsInLKMex = (await retrieveCheapestItems(collectionKey, {
        currency: 'LKMEX-aab910'
    }, limit, skip)).map((i) => {
        return {
            ...i,
            priceInEGLD: i.price * rates["LK-MEX"] / rates.EGLD,
        };
    });

    return [
        ...cheapestItemsInLKMex,
        ...cheapestItemsInEGLD
    ].sort((a,b) => a.priceInEGLD - b.priceInEGLD);
}

/**
 * @param {string} collectionKey - the collection name in the mongo db
 * @param {object} filter - e.g {token_id: "<token_id>"}
 * @param {number} limit - the max number of item to retrieve
 * @param {number} skip - the number of item to skip (i.e pagination)
 * @param {number} belowRank - retrieve only items below this rank
 * @returns {Promise<[]>}
 */
export const retrieveCheapestItemsUnderRank = async (collectionKey, filter = {}, limit = 10, skip = 0, belowRank) => {
    return _retrieveCheapestItemsUnderRank_(client, dbName, collectionKey, filter, limit, skip, belowRank);
}

/**
 * @param {string} collectionKey - the collection name in the mongo db
 * @returns {Promise<int>} the number of items - 0 if it doesn't contain the number of items
 */
export const retrieveNumberOfItems = async (collectionKey) => {
    const lastRank = (await _retrieveItemsSorted_(client, dbName, collectionKey, {
        rank: {
            $exists: true,
            $ne: null
        }
    }, 1, {rank: -1}, 0));
    return lastRank[0] ? lastRank[0].rank : 0;
}

/**
 * @param {string} collectionKey - the collection name in the mongo db
 * @param {object} filter - e.g {token_id: "<token_id>"}
 * @param {number} limit - the max number of item to retrieve
 * @param {number} skip - the number of item to skip (i.e pagination)
 * @param {string} traitName - the name of the trait (e.g 'body')
 * @param {string} traitValue - the value of the trait (e.g 'yellow')
 * @returns {Promise<[]>}
 */
export const retrieveCheapestItemsWithSpecialTrait = async (collectionKey, filter = {}, limit = 10, skip = 0, traitName, traitValue) => {
    return _retrieveCheapestItemsWithSpecialTrait_(client, dbName, collectionKey, filter, limit, skip, traitName, traitValue);
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
    return _updateItem_(client, dbName, collectionKey, query, newValues, unsetValues);
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
 * @param {string} collectionKey - the collection name in the mongo db
 * @param {{}} query - e.g { _id: ObjectId('61f68d54dd363a7674c9357f') }
 * @param {{}} historyEntry - e.g {price: 10, seller: xxx, buyer: xxx, isBid: true, }
 * @returns {Promise<boolean>}
 */
export const addHistoryEntryToItem = async (collectionKey, query, historyEntry) => {
    return _addHistoryEntryToItem_(client, dbName, collectionKey, query, historyEntry);
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

///////////////////            DATABASE UPSERT         ///////////////////

/**
 * Insert an item in the db - update it if it exists
 * @param {string} collectionKey - the collection name in the mongo db
 * @param {{}} query - e.g { _id: ObjectId('61f68d54dd363a7674c9357f') }
 * @param {{}} values - e.g {name: "Mickey", address: "Canyon 123" } - the values to set or update
 * @param {{}} unsetValues - e.g {name: "", address: "" } - the values to remove
 * @returns {Promise<boolean>}
 */
export const upsertItem = async (collectionKey, query, values, unsetValues = {}) => {
    return _upsertItem_(client, dbName, collectionKey, query, values, unsetValues);
}

///////////////////            DATABASE DELETE         ///////////////////

/**
 * Delete an item from the db
 * @param {string} collectionKey - the collection name in the mongo db
 * @param {{}} query - e.g { _id: ObjectId('61f68d54dd363a7674c9357f') }
 * @returns {Promise<boolean>}
 */
export const deleteItem = async (collectionKey, query) => {
    return _deleteItem_(client, dbName, collectionKey, query);
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
 * Rename a collection
 * @param {string} collectionKey - the collection name
 * @param {string} newCollectionKey
 * @returns {Promise<boolean>} true if it succeeded - false otherwise
 */
export const renameCollection = async (collectionKey, newCollectionKey) => {
    try {
        await client.db(dbName).collection(collectionKey).rename(newCollectionKey);
        return true;
    } catch (e) {
        return false;
    }
}

/**
 * Get the collections name of the db
 * @returns {Promise<string[]>} the collections
 */
export const getCollectionsName = async () => {
    return _getCollectionsName_(client, dbName);
}

/**
 * Deleet all elrond collections data, except the info db
 * @returns {Promise<void>}
 */
export const deleteAllNFTCollections = async () => {
    const cs = await getCollectionsName();
    for (let i = 0; i < cs.length; i++) {
        if (cs[i] !== 'info')
            await deleteCollection(cs[i]);
    }
}

/**
 * Delete a collection
 * @param {string} collectionKey - the collection name
 * @returns {Promise<boolean>} true if it succeeded - false otherwise
 */
export const deleteCollection = async (collectionKey) => {
    return _deleteCollection_(client, dbName, collectionKey);
}