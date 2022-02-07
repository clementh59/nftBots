import {
    _addItemToCollection_,
    _closeConnection_,
    _initConnection_,
    _retrieveItems_,
    _updateItem_
} from "../../db/db.js";
import {createRequire} from "module";

const require = createRequire(import.meta.url);
const config = require("../config.json");
const dbName = config.mongo.dbs.collections;
const collectionName = 'info';

let client;

const fields = {
    randomEarth: 'lastTxAnalyzedRandomEarth'
};

/**
 * Init the client and the connection with the mongodb server
 * @returns {Promise<boolean>} - true if the connection is ok - false otherwise
 */
export const initInfoDbConnection = async () => {
    const uri = config.mongo.uri;
    client = await _initConnection_(client, uri);
    return !!client;
}

/**
 *
 * @param {{number}} lastTxId
 * @returns {Promise<void>}
 * @private
 */
export const setLastTransactionAnalyzedRandomEarth = async (lastTxId) => {
    return setLastTransactionAnalyzed(lastTxId, fields.randomEarth);
}

/**
 *
 * @returns {Promise<number>}
 */
export const getLastTransactionIdAnalyzedRandomEarth = async () => {
    return (await getLastTransactionIdAnalyzed())[fields.randomEarth];
}

/**
 *
 * @returns {Promise<number>}
 */
const getLastTransactionIdAnalyzed = async () => {
    const items = await _retrieveItems_(client, dbName, collectionName, {}, 1);
    return items[0];
}

/**
 *
 * @param {{number}} lastTxId
 * @param {{string}} fieldName
 * @returns {Promise<void>}
 * @private
 */
const setLastTransactionAnalyzed = async (lastTxId, fieldName) => {
    const values = {};
    values[`${fieldName}`] = lastTxId;
    return _updateItem_(client, dbName, collectionName, {}, values);
}

/**
 * Close the connection with the mongodb server
 * @returns {Promise<boolean>} - true if the connection has been successfully closed - false otherwise
 */
export const closeInfoDbConnection = async () => {
    return _closeConnection_(client);
}