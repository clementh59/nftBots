import {retrieveAndAnalyzeTxs, timer} from "../../utils.js";
import {createRequire} from "module";

const require = createRequire(import.meta.url);
const config = require("../config.json");
import {
    decodeTransactionData,
    getLastTransactions,
    hexToDecimal,
    hexToString,
    microCurrencyToCurrency
} from "./../elrondUtils.js";
import {addToLogErrorSystem, addToLogSystem} from "../../logSystem.js";
import {
    getLastTransactionIdAnalyzedDeadRare, setDeadRareIsUpToDate,
    setLastTransactionAnalyzedDeadRare
} from "../db/infoAndStatusDB.js";
import {deleteItem, initConnection, retrieveItems, upsertItem} from "./../db/elrondDB.js";
import {analyzeSales} from "./../analysisAlgorithm.js";

// set it to true if you want to update db
const updateDB = config.updateDB;

const ordersCollection = 'deadRareOrders';

let collectionUpdated = [];

const addToDb = async (number, collection, price, timestamp, txHash, orderId) => {
    if (!updateDB)
        return;
    collectionUpdated.push(collection);
    await Promise.all([
        upsertItem(collection, {token_id: number}, {
            token_id: number,
            order: config.constants.order.SALE,
            marketplace: 'DeadRare',
            price: price,
            hash: txHash,
            currency: 'EGLD',
            //owner: info.seller,
            status: {
                date: new Date(timestamp * 1000).toDateString(),
            },
        }),
        upsertItem(ordersCollection, {orderId: orderId}, {
            orderId,
            collection,
            number,
            type: 'sale'
        })
    ]);
}

const removeFromDb = async (number, collection, txHash) => {
    if (!updateDB)
        return;
    const update = {
        token_id: number,
        order: config.constants.order.NONE,
        hash: txHash
    }

    collectionUpdated.push(collection);

    await upsertItem(collection, {'token_id': number}, update, {
        marketplace: "",
        price: "",
        status: "",
        currency: ""
    });
}

const removeFromDbFromOrderId = async (orderId, txHash) => {
    if (!updateDB)
        return;

    const res = (await retrieveItems(ordersCollection, {orderId: orderId}, 1))[0];

    if (!res)
        return;

    const collection = res.collection;
    const number = res.number;

    if (!collection || !number)
        return;

    await Promise.all([
        removeFromDb(number, collection, txHash),
        deleteItem(ordersCollection, {orderId})
    ]);
}

/**
 * The function that is called when db is up to date with the blockchain
 * @returns {Promise<void>}
 */
export const endOfLoopTreatment = async () => {
    setDeadRareIsUpToDate(true); // no need to await
    await analyzeSales(collectionUpdated);
    collectionUpdated = [];
}

const getLastTxs = async (offset) => {
    return getLastTransactions(config.contracts.deadRare, offset, 50);
}

const analyzeDeadRareTransaction = async (tx) => {

    try {

        if (tx.status !== 'success')
            return;

        let hexCollectionName, hexNFTNumber, price, number, collection, parts, orderId;

        parts = decodeTransactionData(tx.data);

        switch (parts[0]) {
            case 'withdraw':
                await removeFromDbFromOrderId(parts[1], tx.txHash);
                break;
            case 'updatePrice':
                hexCollectionName = parts[2];
                hexNFTNumber = parts[3];
                price = microCurrencyToCurrency(hexToDecimal(parts[4]));
                collection = hexToString(hexCollectionName);
                number = hexToDecimal(hexNFTNumber);
                orderId = parts[1];
                //console.log(`Price change - https://deadrare.io/nft/${collection}-${hexNFTNumber} #${orderId} - ${price} EGLD`);
                await addToDb(number, collection, price, tx.timestamp, tx.txHash, orderId);
                break;
            case 'buyNft':
                hexCollectionName = parts[2];
                hexNFTNumber = parts[3];
                collection = hexToString(hexCollectionName);
                number = hexToDecimal(hexNFTNumber);
                //console.log(`New item bought - https://deadrare.io/nft/${collection}-${hexNFTNumber}`);
                await removeFromDb(number, collection, tx.txHash);
                break;
            case 'ESDTNFTTransfer':
                hexCollectionName = parts[1];
                hexNFTNumber = parts[2];
                price = microCurrencyToCurrency(hexToDecimal(parts[6]));
                collection = hexToString(hexCollectionName);
                number = hexToDecimal(hexNFTNumber);
                orderId = decodeTransactionData(tx.results[tx.results.length - 1].data)[2];
                //console.log(`New listing - https://deadrare.io/nft/${collection}-${hexNFTNumber} (#${orderId}) - ${price} EGLD`);
                await addToDb(number, collection, price, tx.timestamp, tx.txHash, orderId);
                break;
            case 'rejectOffer':
                break;
            case 'makeOffer':
                break;
            case 'withdrawOffer':
                break;
            case 'acceptOffer':
                await removeFromDbFromOrderId(parts[1], tx.txHash);
                break;
            default:
                addToLogSystem('unsupported transaction deadrare');
                addToLogErrorSystem(JSON.stringify(tx));
                break;
        }

    } catch (e) {
        console.log(e);
        addToLogErrorSystem('TX analysis thrown (deadrare)');
        addToLogErrorSystem(JSON.stringify(tx));
    }
}

const setLastTransactionAnalyzed = async (tx) => {
    if (!updateDB)
        return;
    await setLastTransactionAnalyzedDeadRare(tx.txHash, tx.timestamp);
    return {
        hash: tx.txHash,
        timestamp: tx.timestamp
    }
}

const txHasBeenAnalyzed = (tx, txComparison) => {
    if (tx.timestamp > txComparison.timestamp)
        return false;
    // this method isn't perfect if multiple txs have the same timestamp
    return !(tx.timestamp === txComparison.timestamp && tx.txHash !== txComparison.hash);
}

export const deadRareBot = async () => {
    if (!updateDB) {
        console.log('warning - updateDB is set to false!!!!!');
        await timer(5000);
    }
    await setDeadRareIsUpToDate(false);
    const lastTxAnalyzed = await getLastTransactionIdAnalyzedDeadRare();
    retrieveAndAnalyzeTxs({
        "getLastTransactions": getLastTxs,
        "txHasBeenAnalyzed": txHasBeenAnalyzed,
        "lastTxAnalyzed": lastTxAnalyzed,
        "analyzeTransaction": analyzeDeadRareTransaction,
        "setLastTransactionAnalyzed": setLastTransactionAnalyzed,
        "instance": "TrustMarket",
        "timeBetweenRequests": config.timeBetweenElrondAPIRequests,
        "endOfLoopTreatment": endOfLoopTreatment,
    });
}

/*const test = async () => {
    await initConnection();
    await analyzeDeadRareTransaction(tx);
    console.log('done')
};*/