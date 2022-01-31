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
export const setLastTransactionAnalyzed = async (lastTxId) => {
    return _updateItem_(client, dbName, collectionName, {}, {lastTxAnalyzed: lastTxId});
}

/**
 *
 * @returns {Promise<number>}
 */
export const getLastTransactionIdAnalyzed = async () => {
    const items = await _retrieveItems_(client, dbName, collectionName, {}, 1);
    return items[0].lastTxAnalyzed;
}

/**
 * Set up the infoDB. Needs to be called only when adding new smart contract - blockchain. Otherwise, data will be lost.
 * @returns {Promise<boolean>}
 */
export const setUpInfoDb = async () => {
    return _addItemToCollection_(client, dbName, collectionName, {lastTxAnalyzed: 0});
}

/**
 * Close the connection with the mongodb server
 * @returns {Promise<boolean>} - true if the connection has been successfully closed - false otherwise
 */
export const closeInfoDbConnection = async () => {
    return _closeConnection_(client);
}