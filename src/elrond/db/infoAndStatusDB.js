import {
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

export const setLastTransactionAnalyzedTrustMarket = async (lastTxHash, lastTxTimestamp) => {
    return setLastTransactionAnalyzed(lastTxHash, lastTxTimestamp, 'TrustMarket');
}

/**
 *
 * @returns {Promise<{hash: *, timestamp: *}>}
 */
export const getLastTransactionIdAnalyzedTrustMarket = async () => {
    return getLastTransactionIdAnalyzed('TrustMarket');
}

export const setLastTransactionAnalyzedDeadRare = async (lastTxHash, lastTxTimestamp) => {
    return setLastTransactionAnalyzed(lastTxHash, lastTxTimestamp, 'DeadRare');
}

/**
 *
 * @returns {Promise<{hash: *, timestamp: *}>}
 */
export const getLastTransactionIdAnalyzedDeadRare = async () => {
    return getLastTransactionIdAnalyzed('DeadRare');
}

/**
 * @param {string} platform - e.g 'TrustMarket'
 * @returns {Promise<{hash: *, timestamp: *}>}
 */
const getLastTransactionIdAnalyzed = async (platform) => {
    const items = await _retrieveItems_(client, dbName, collectionName, {}, 1);
    return {
        timestamp: items[0][`lastTxTimestamp${platform}`],
        hash: items[0][`lastTxHash${platform}`]
    };
}

/**
 *
 * @param {{string}} lastTxHash
 * @param {{number}} txTimestamp
 * @param {{string}} platformName
 * @returns {Promise<void>}
 * @private
 */
const setLastTransactionAnalyzed = async (lastTxHash, txTimestamp, platformName) => {
    const values = {};
    values[`lastTxHash${platformName}`] = lastTxHash;
    values[`lastTxTimestamp${platformName}`] = txTimestamp;
    return _updateItem_(client, dbName, collectionName, {}, values);
}

/**
 * Close the connection with the mongodb server
 * @returns {Promise<boolean>} - true if the connection has been successfully closed - false otherwise
 */
export const closeInfoDbConnection = async () => {
    return _closeConnection_(client);
}