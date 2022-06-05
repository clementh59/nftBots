import {retrieveAndAnalyzeTxs, timer} from "../utils.js";
import {createRequire} from "module";
const require = createRequire(import.meta.url);
const config = require("./config.json");
import {
    decodeTransactionData,
    getLastTransactions,
    hexToDecimal,
    hexToString,
    microCurrencyToCurrency
} from "./elrondUtils.js";
import {addToLogErrorSystem, addToLogSystem} from "../logSystem.js";
import {
    getLastTransactionIdAnalyzedDeadRare,
    setLastTransactionAnalyzedDeadRare
} from "./infoAndStatusDB/infoAndStatusDB.js";
import {upsertItem} from "./elrondDB.js";
import {analyzeSales} from "./analysisAlgorithm.js";

// set it to true if you want to update db
const updateDB = config.updateDB;

let collectionUpdated = [];

const addToDb = async (number, collection, price, timestamp, txHash) => {
    if (!updateDB)
        return;
    collectionUpdated.push(collection);
    await upsertItem(collection, {token_id: number}, {
        token_id: number,
        order: config.constants.order.SALE,
        marketplace: 'DeadRare',
        price: price,
        hash: txHash,
        currency: 'EGLD',
        //owner: info.seller,
        status: {
            date: new Date(timestamp*1000).toDateString(),
        },
    });
}

const removeFromDb = async (number, collection) => {
    if (!updateDB)
        return;
    const update = {
        token_id: number,
        order: config.constants.order.NONE,
    }

    collectionUpdated.push(collection);

    await upsertItem(collection, {'token_id': number}, update, {
        marketplace: "",
        price: "",
        status: "",
        currency: ""
    });
}

/**
 * The function that is called when db is up to date with the blockchain
 * @returns {Promise<void>}
 */
export const endOfLoopTreatment = async () => {
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

        let hexCollectionName, hexNFTNumber, price, currency, number, collection, data, parts, topics;

        parts = decodeTransactionData(tx.data);

        switch (parts[0]) {
            case 'withdraw':
                break;
            case 'updatePrice':
                hexCollectionName = parts[2];
                hexNFTNumber = parts[3];
                price = microCurrencyToCurrency(hexToDecimal(parts[4]));
                collection = hexToString(hexCollectionName);
                number = hexToDecimal(hexNFTNumber);
                //console.log(`Price change - https://deadrare.io/nft/${collection}-${hexNFTNumber} - ${price} EGLD`);
                await addToDb(number, collection, price, tx.timestamp, tx.txHash);
                break;
            case 'buyNft':
                hexCollectionName = parts[2];
                hexNFTNumber = parts[3];
                collection = hexToString(hexCollectionName);
                number = hexToDecimal(hexNFTNumber);
                //console.log(`New item bought - https://deadrare.io/nft/${collection}-${hexNFTNumber}`);
                await removeFromDb(number, collection);
                break;
            case 'ESDTNFTTransfer':
                hexCollectionName = parts[1];
                hexNFTNumber = parts[2];
                price = microCurrencyToCurrency(hexToDecimal(parts[6]));
                collection = hexToString(hexCollectionName);
                number = hexToDecimal(hexNFTNumber);
                //console.log(`New listing - https://deadrare.io/nft/${collection}-${hexNFTNumber} - ${price} EGLD`);
                break;
            case 'rejectOffer':
                break;
            case 'makeOffer':
                break;
            case 'withdrawOffer':
                break;
            case 'acceptOffer':
                break;
            default:
                addToLogSystem('unsupported transaction deadrare');
                addToLogErrorSystem(JSON.stringify(tx));
                break;
        }

    } catch (e) {
        addToLogErrorSystem('TX analysis thrown');
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