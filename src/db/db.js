import {MongoClient, ObjectId} from 'mongodb'
import {isAMochaTest} from "../utils.js";

const dbNameMocha = 'mocha';

///////////////////            DATABASE READ         ///////////////////

/**
 * @param {MongoClient} client
 * @param {string} dbName - the db name
 * @param {string} collectionKey - the collection name in the mongo db
 * @param {object} filter - e.g {token_id: "<token_id>"}
 * @param {number} limit - the max number of item to retrieve
 * @param {number} skip - the number of item to skip (i.e pagination)
 * @returns {Promise<[]>}
 */
export const _retrieveItems_ = async (client, dbName, collectionKey, filter, limit = 10, skip = 0) => {
    if (isAMochaTest())
        dbName = 'mocha';
    return client.db(dbName).collection(collectionKey).find(filter).skip(skip).limit(limit).toArray();
}

/**
 * @param {MongoClient} client
 * @param {string} dbName - the db name
 * @param {string} collectionKey - the collection name in the mongo db
 * @param {object} filter - e.g {token_id: "<token_id>"}
 * @param {number} limit - the max number of item to retrieve
 * @param {{}} sort - e.g {score: 1} - 1 means ascending and -1 descending
 * @param {number} skip - the number of item to skip (i.e pagination)
 * @returns {Promise<[]>}
 */
export const _retrieveItemsSorted_ = async (client, dbName, collectionKey, filter, limit = 10, sort, skip = 0) => {
    if (isAMochaTest())
        dbName = 'mocha';
    return client.db(dbName).collection(collectionKey).find(filter).sort(sort).skip(skip).limit(limit).toArray();
}

/**
 * @param {MongoClient} client
 * @param {string} dbName - the db name
 * @param {string} collectionKey - the collection name in the mongo db
 * @param {object} filter - e.g {token_id: "<token_id>"}
 * @param {number} limit - the max number of item to retrieve
 * @param {number} skip - the number of item to skip (i.e pagination)
 * @returns {Promise<[]>}
 */
export const _retrieveCheapestItems_ = async (client, dbName, collectionKey, filter = {}, limit = 10, skip = 0) => {
    if (isAMochaTest())
        dbName = 'mocha';
    const _filter = {
        price: {$exists: true, $ne: null},
        ...filter
    }
    return client.db(dbName).collection(collectionKey).find(_filter).sort({price: 1}).skip(skip).limit(limit).toArray();
}

/**
 * @param {MongoClient} client
 * @param {string} dbName - the db name
 * @param {string} collectionKey - the collection name in the mongo db
 * @param {object} filter - e.g {token_id: "<token_id>"}
 * @param {number} limit - the max number of item to retrieve
 * @param {number} skip - the number of item to skip (i.e pagination)
 * @param {number} belowRank - retrieve only items below this rank
 * @returns {Promise<[]>}
 */
export const _retrieveCheapestItemsUnderRank_ = async (client, dbName, collectionKey, filter = {}, limit = 10, skip = 0, belowRank) => {
    if (isAMochaTest())
        dbName = 'mocha';
    const _filter = {
        price: {$exists: true, $ne: null},
        rank: {$lt: belowRank},
        ...filter
    }
    return client.db(dbName).collection(collectionKey).find(_filter).sort({price: 1}).skip(skip).limit(limit).toArray();
}

/**
 * @param {MongoClient} client
 * @param {string} dbName - the db name
 * @param {string} collectionKey - the collection name in the mongo db
 * @param {object} filter - e.g {token_id: "<token_id>"}
 * @param {number} limit - the max number of item to retrieve
 * @param {number} skip - the number of item to skip (i.e pagination)
 * @param {string} traitName - the name of the trait (e.g 'body')
 * @param {string} traitValue - the value of the trait (e.g 'yellow')
 * @returns {Promise<[]>}
 */
export const _retrieveCheapestItemsWithSpecialTrait_ = async (client, dbName, collectionKey, filter = {}, limit = 10, skip = 0, traitName, traitValue) => {
    if (isAMochaTest())
        dbName = 'mocha';
    const _filter = {
        price: {$exists: true, $ne: null},
        attributes: {trait_type: traitName, value: traitValue},
        ...filter
    }
    return client.db(dbName).collection(collectionKey).find(_filter).sort({price: 1}).skip(skip).limit(limit).toArray();
}

///////////////////            DATABASE UPDATE         ///////////////////

/**
 * @param {MongoClient} client
 * @param {string} dbName - the db name
 * @param {string} collectionKey - the collection name in the mongo db
 * @param {string|ObjectId} id - the object id
 * @param {{}} newValues - e.g {name: "Mickey", address: "Canyon 123"}
 * @returns {Promise<boolean>} true if the item was updated - false otherwise
 */
export const _updateItemWithObjectId_ = async (client, dbName, collectionKey, id, newValues) => {
    if (isAMochaTest())
        dbName = 'mocha';

    let query;

    if (typeof id === 'string')
        query = {_id: ObjectId(id)};
    else
        query = {_id: id};

    return _updateItem_(client, dbName, collectionKey, query, newValues)
}

/**
 * @param {MongoClient} client
 * @param {string} dbName - the db name
 * @param {string} collectionKey - the collection name in the mongo db
 * @param {{}} query - e.g { _id: ObjectId('61f68d54dd363a7674c9357f') }
 * @param {{}} newValues - e.g {name: "Mickey", address: "Canyon 123" }
 * @param {{}} unsetValues - e.g {name: "", address: "" }
 * @returns {Promise<boolean>}
 */
export const _updateItem_ = async (client, dbName, collectionKey, query, newValues, unsetValues = {}) => {
    if (isAMochaTest())
        dbName = 'mocha';
    try {
        const newVal = {$set: newValues, $unset: unsetValues};
        const res = await client.db(dbName).collection(collectionKey).updateOne(query, newVal);
        return res.acknowledged;
    } catch (e) {
        return false;
    }
}

/**
 * @param {MongoClient} client
 * @param {string} dbName - the db name
 * @param {string} collectionKey - the collection name in the mongo db
 * @param {{}} query - e.g { _id: ObjectId('61f68d54dd363a7674c9357f') }
 * @param {{}} historyEntry - e.g {price: 10, isBid: true, date: xxx, tx: xxx}
 * @returns {Promise<boolean>}
 */
export const _addHistoryEntryToItem_ = async (client, dbName, collectionKey, query, historyEntry) => {
    if (isAMochaTest())
        dbName = 'mocha';
    try {
        const item = (await _retrieveItems_(client, dbName, collectionKey, query, 1))[0];
        if (item.history?.find(i => i.txhash === historyEntry.txhash))
            return true;
        const newVal = { $push: { history: historyEntry } };
        const res = await client.db(dbName).collection(collectionKey).updateOne(query, newVal);
        return res.acknowledged;
    } catch (e) {
        return false;
    }
}

/**
 * @param {MongoClient} client
 * @param {string} dbName - the db name
 * @param {string} collectionKey - the collection name in the mongo db
 * @param {{}} query
 * @param {{}} newValues - e.g {name: "Mickey", address: "Canyon 123" }
 * @param {{}} unsetValues - e.g {name: "", address: "" }
 * @returns {Promise<boolean>}
 */
export const _updateItems_ = async (client, dbName, collectionKey, query, newValues, unsetValues = {}) => {
    if (isAMochaTest())
        dbName = 'mocha';
    try {
        const newVal = {$set: newValues, $unset: unsetValues};
        const res = await client.db(dbName).collection(collectionKey).updateMany(query, newVal);
        return res.acknowledged;
    } catch (e) {
        return false;
    }
}

/**
 * Order a list and add a rank field to each items
 * @param {MongoClient} client
 * @param {string} dbName - the db name
 * @param {string} collectionKey - the collection name in the mongo db
 * @param {{}} sort - e.g {rarity_score: 1} - 1 means ascending and -1 descending
 * @returns {Promise<Document>}
 */
export const _addRankToItems_ = async (client, dbName, collectionKey, sort) => {
    if (isAMochaTest())
        dbName = 'mocha';

    let items = [];
    let skip = 0;
    let rank = 1;

    do {
        items = await _retrieveItemsSorted_(client, dbName, collectionKey, {}, 50, sort, skip);
        for (let i = 0; i < items.length; i++) {
            await _updateItemWithObjectId_(client, dbName, collectionKey, items[i]._id, {rank: rank++});
        }
        skip += items.length;
    } while (items.length > 0)
}

///////////////////            DATABASE WRITE         ///////////////////

/**
 * @param {MongoClient} client
 * @param {string} dbName - the db name
 * @param {string} collectionKey - the collection name in the mongo db
 * @param {object} item
 * @returns {Promise<boolean>} true if the item was added - false otherwise
 */
export const _addItemToCollection_ = async (client, dbName, collectionKey, item) => {
    if (isAMochaTest())
        dbName = 'mocha';
    try {
        const res = await client.db(dbName).collection(collectionKey).insertOne(item);
        return res.acknowledged;
    } catch (e) {
        return false;
    }
}

/**
 *
 * @param {MongoClient} client
 * @param {string} dbName - the db name
 * @param {string} collectionKey - the collection name in the mongo db
 * @param {[]} items
 * @returns {Promise<boolean>} true if the item were added - false otherwise
 */
export const _addItemsToCollection_ = async (client, dbName, collectionKey, items) => {
    if (isAMochaTest())
        dbName = 'mocha';
    try {
        const res = await client.db(dbName).collection(collectionKey).insertMany(items);
        return res.acknowledged;
    } catch (e) {
        return false;
    }
}

///////////////////            DATABASE UPSERT         ///////////////////

/**
 * Insert an item in the db - update it if it exists
 * @param {MongoClient} client
 * @param {string} dbName - the db name
 * @param {string} collectionKey - the collection name in the mongo db
 * @param {{}} query - e.g { _id: ObjectId('61f68d54dd363a7674c9357f') }
 * @param {{}} values - e.g {name: "Mickey", address: "Canyon 123" } - the values to set or update
 * @param {{}} unsetValues - e.g {name: "", address: "" } - the values to remove
 * @returns {Promise<boolean>}
 */
export const _upsertItem_ = async (client, dbName, collectionKey, query, values, unsetValues = {}) => {
    if (isAMochaTest())
        dbName = 'mocha';
    try {
        const newVal = {$set: values, $unset: unsetValues};
        const res = await client.db(dbName).collection(collectionKey).updateOne(query, newVal, {upsert: true});
        return res.acknowledged;
    } catch (e) {
        console.log(e);
        return false;
    }
}

///////////////////            DATABASE DELETE         ///////////////////

/**
 * Delete an item from the db
 * @param {MongoClient} client
 * @param {string} dbName - the db name
 * @param {string} collectionKey - the collection name in the mongo db
 * @param {{}} query - e.g { _id: ObjectId('61f68d54dd363a7674c9357f') }
 * @returns {Promise<boolean>}
 */
export const _deleteItem_ = async (client, dbName, collectionKey, query) => {
    if (isAMochaTest())
        dbName = 'mocha';
    try {
        const res = await client.db(dbName).collection(collectionKey).deleteOne(query);
        return res.acknowledged;
    } catch (e) {
        console.log(e);
        return false;
    }
}

///////////////////             DATABASE MANAGEMENT         ///////////////////

/**
 * Init the client and the connection with the mongodb server
 * @returns {Promise<MongoClient>} - true if the connection is ok - false otherwise
 */
export const _initConnection_ = async (client, uri) => {
    client = new MongoClient(uri);
    try {
        await client.connect();
        return client;
    } catch (e) {
        return null;
    }
}

/**
 * Init the connection with the mongodb server
 * @returns {Promise<boolean>} - true if the connection has been successfully closed - false otherwise
 */
export const _closeConnection_ = async (client) => {
    try {
        await client.close();
        return true
    } catch (e) {
        console.log(e);
        return false;
    }
}

/**
 *
 * Add a unique index in the given collection.
 * e.g: await addUniqueIndex(collectionKey, {'token_id': 1});
 *
 * @param {MongoClient} client
 * @param {string} dbName - the db name
 * @param {string} collectionKey - the collection name
 * @param {object} fieldParameter - the field that needs to be unique & the sort condition. eg {fieldName: 1}
 * @returns {Promise<boolean>} true if it succeeded - false otherwise
 */
export const _addUniqueIndex_ = async (client, dbName, collectionKey, fieldParameter) => {
    if (isAMochaTest())
        dbName = 'mocha';
    try {
        const res = await client.db(dbName).collection(collectionKey).createIndex(fieldParameter, {unique: true});
        return res.toString().endsWith('_1');
    } catch (e) {
        return false;
    }
}

/**
 * Create a collection
 * @param {MongoClient} client
 * @param {string} dbName - the db name
 * @param {string} collectionKey - the collection name
 * @returns {Promise<boolean>} true if it succeeded - false otherwise
 */
export const _createCollection_ = async (client, dbName, collectionKey) => {
    if (isAMochaTest())
        dbName = 'mocha';
    try {
        await client.db(dbName).createCollection(collectionKey);
        return true;
    } catch (e) {
        return false;
    }
}

/**
 * Rename a collection
 * @param {MongoClient} client
 * @param {string} dbName - the db name
 * @param {string} collectionKey - the collection name
 * @param {string} newCollectionKey
 * @returns {Promise<boolean>} true if it succeeded - false otherwise
 */
export const _renameCollection_ = async (client, dbName, collectionKey, newCollectionKey) => {
    if (isAMochaTest())
        dbName = 'mocha';
    try {
        await client.db(dbName).collection(collectionKey).rename(newCollectionKey);
        return true;
    } catch (e) {
        return false;
    }
}

/**
 * Get the collections name of the db
 * @param {MongoClient} client
 * @param {string} dbName - the db name
 * @returns {Promise<string[]>} the collections
 */
export const _getCollectionsName_ = async (client, dbName) => {
    if (isAMochaTest())
        dbName = 'mocha';
    return (await (await client.db(dbName).listCollections()).toArray()).map((i) => i.name);
}

/**
 * Delete a collection
 * @param {MongoClient} client
 * @param {string} dbName - the db name
 * @param {string} collectionKey - the collection name
 * @returns {Promise<boolean>} true if it succeeded - false otherwise
 */
export const _deleteCollection_ = async (client, dbName, collectionKey) => {
    if (isAMochaTest())
        dbName = 'mocha';
    try {
        await client.db(dbName).collection(collectionKey).drop();
        return true;
    } catch (e) {
        return false;
    }
}