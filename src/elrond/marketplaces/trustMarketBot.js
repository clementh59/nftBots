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
    getLastTransactionIdAnalyzedTrustMarket,
    setLastTransactionAnalyzedTrustMarket, setTrustMarketIsUpToDate
} from "../db/infoAndStatusDB.js";
import {deleteItem, retrieveItems, upsertItem} from "../db/elrondDB.js";
import {analyzeSales} from "../analysisAlgorithm.js";

// set it to true if you want to update db
const updateDB = config.updateDB;
const ordersCollection = 'trustMarketOrders';

let collectionUpdated = [];

//region db
const addToDb = async (number, collection, price, timestamp, txHash, currency, orderId) => {
    if (!updateDB)
        return;
    collectionUpdated.push(collection);
    await Promise.all([
        upsertItem(collection, {token_id: number}, {
            token_id: number,
            order: config.constants.order.SALE,
            marketplace: 'TrustMarket',
            price: price,
            hash: txHash,
            currency: currency,
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

const addOfferToDb = async (number, collection, orderId) => {
    if (!updateDB)
        return;
    await upsertItem(ordersCollection, {orderId: orderId}, {
        orderId,
        collection,
        number,
        type: 'offer'
    })
}

const changePrice = async (orderId, price, currency, txHash) => {
    if (!updateDB)
        return;

    const res = (await retrieveItems(ordersCollection, {orderId: orderId}, 1))[0];

    if (!res)
        return;

    const collection = res.collection;
    const number = res.number;

    if (!collection || !number)
        return;

    collectionUpdated.push(collection);
    await upsertItem(collection, {token_id: number}, {
        token_id: number,
        order: config.constants.order.SALE,
        marketplace: 'TrustMarket',
        price: price,
        hash: txHash,
        currency: currency,
        //owner: info.seller,
    });
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
        deleteItem(ordersCollection, {collection: collection, number: number})
    ]);
}
//endregion db

/**
 * The function that is called when db is up to date with the blockchain
 * @returns {Promise<void>}
 */
export const endOfLoopTreatment = async () => {
    if (!updateDB)
        return;
    setTrustMarketIsUpToDate(true); // no need to await
    await analyzeSales(collectionUpdated);
    collectionUpdated = [];
}

const getLastTxs = async (offset) => {
    return getLastTransactions(config.contracts.trustMarket, offset, 50);
}

const analyzeTrustMarketTransaction = async (tx) => {

    try {

        if (tx.status !== 'success')
            return;

        let hexCollectionName, hexNFTNumber, price, currency, number, collection, data, parts, topics, orderId;

        parts = decodeTransactionData(tx.data);

        switch (tx.function) {
            case 'listing':
                hexCollectionName = parts[1];
                hexNFTNumber = parts[2];
                price = microCurrencyToCurrency(hexToDecimal(parts[7]));
                currency = hexToString(parts[9]);
                collection = hexToString(hexCollectionName);
                number = hexToDecimal(hexNFTNumber);

                orderId = decodeTransactionData(tx.results[tx.results.length - 1].data)[2];
                //console.log(`Listing - https://www.trust.market/nft/${collection}-${hexNFTNumber} #${orderId} - ${price} ${currency}`)
                await addToDb(number, collection, price, tx.timestamp, tx.txHash, currency, orderId);
                break;
            case 'buy':
                if (parts[0] === 'buy') {
                    await removeFromDbFromOrderId(parts[1], tx.txHash);
                } else if (parts[0] === 'ESDTNFTTransfer') {
                    await removeFromDbFromOrderId(parts[6], tx.txHash);
                } else if (parts[0] === 'ESDTTransfer') {
                    await removeFromDbFromOrderId(parts[4], tx.txHash);
                }
                else {
                    addToLogErrorSystem('Unsupported tx from buy trust market')
                    addToLogErrorSystem(JSON.stringify(tx));
                }
                break;
            case 'withdraw':
                await removeFromDbFromOrderId(parts[1]);
                break;
            case 'changePrice':
                if (parts.length === 3) {
                    price = microCurrencyToCurrency(hexToDecimal(parts[2]));
                    await changePrice(parts[1], price, 'EGLD', tx.txHash);
                } else {
                    addToLogErrorSystem('Unsupported tx from changePrice trust market');
                    addToLogErrorSystem(JSON.stringify(tx));
                }
                //console.log(`Price change - https://www.trust.market/nft/${collection}-${hexNFTNumber} - ${price} ${currency}`)
                break;
            case 'sendOffer':
                if (parts[0] === 'ESDTNFTTransfer') {
                    hexCollectionName = parts[6];
                    hexNFTNumber = parts[7];
                } else if (parts[0] === 'sendOffer') {
                    hexCollectionName = parts[1];
                    hexNFTNumber = parts[2];
                }
                collection = hexToString(hexCollectionName);
                number = hexToDecimal(hexNFTNumber);
                orderId = decodeTransactionData(tx.results[tx.results.length - 1].data)[2];
                await addOfferToDb(number, collection, orderId);
                break;
            case 'withdrawOffer':
                break;
            case 'bid':
                break;
            case 'cleanExpiredOffers':
                break;
            case 'endAuction':
                break;
            case 'acceptOffer':
                await removeFromDbFromOrderId(parts[1]);
                break;
            default:
                addToLogSystem('unsupported transaction trustmarket')
                addToLogSystem(JSON.stringify(tx));
                break;
        }

    } catch (e) {
        addToLogErrorSystem('TX analysis thrown (trust market)');
        addToLogErrorSystem(JSON.stringify(tx));
    }
}

const setLastTransactionAnalyzed = async (tx) => {
    if (!updateDB)
        return;
    await setLastTransactionAnalyzedTrustMarket(tx.txHash, tx.timestamp);
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

export const trustMarketBot = async () => {
    if (!updateDB) {
        console.log('warning - updateDB is set to false!!!!!')
        await timer(5000);
    }
    await setTrustMarketIsUpToDate(false);
    const lastTxAnalyzed = await getLastTransactionIdAnalyzedTrustMarket();
    retrieveAndAnalyzeTxs({
        "getLastTransactions": getLastTxs,
        "txHasBeenAnalyzed": txHasBeenAnalyzed,
        "lastTxAnalyzed": lastTxAnalyzed,
        "analyzeTransaction": analyzeTrustMarketTransaction,
        "setLastTransactionAnalyzed": setLastTransactionAnalyzed,
        "instance": "TrustMarket",
        "timeBetweenRequests": config.timeBetweenElrondAPIRequests,
        "endOfLoopTreatment": endOfLoopTreatment,
    });
}

/*const tx = {};

const test = async () => {
    //await initConnection();
    for (let i = 0; i < 199; i++) {
        const txs = await getLastTxs(i * 50);
        for (let j = 0; j < txs.length; j++) {
            await analyzeTrustMarketTransaction(txs[j]);
        }
    }
    //await analyzeTrustMarketTransaction(tx);
    console.log('done');
};
test()*/