import {retrieveAndAnalyzeTxs, timer} from "../utils.js";
import {createRequire} from "module";
const require = createRequire(import.meta.url);
const config = require("./config.json");
import {
    base64ToHex,
    decodeBase64,
    decodeTransactionData,
    getLastTransactions,
    hexToDecimal,
    hexToString,
    microCurrencyToCurrency
} from "./elrondUtils.js";
import {addToLogErrorSystem, addToLogSystem} from "../logSystem.js";
import {
    getLastTransactionIdAnalyzedTrustMarket,
    setLastTransactionAnalyzedTrustMarket
} from "./infoAndStatusDB/infoAndStatusDB.js";
import {upsertItem} from "./elrondDB.js";
import {analyzeSales} from "./analysisAlgorithm.js";

// set it to true if
const updateDB = true;

let collectionUpdated = [];

const addToDb = async (number, collection, price, timestamp, txHash, currency) => {
    if (!updateDB)
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
    return getLastTransactions(config.contracts.trustMarket, offset, 50);
}

const analyzeTrustMarketTransaction = async (tx) => {

    try {

        if (tx.status !== 'success')
            return;

        let hexCollectionName, hexNFTNumber, price, currency, number, collection, data, parts, topics;

        switch (tx.function) {
            case 'buy':

                if (tx.action.category === 'esdtNft') {
                    const args = tx.action.arguments;
                    hexCollectionName = args.functionArgs[1];
                    hexNFTNumber = args.functionArgs[2];
                    price = microCurrencyToCurrency(args.transfers[0].value);
                    currency = args.transfers[0].ticker;
                    //todo: check if it is the real lkmex (not fake currencies)
                } else {
                    data = tx.data;
                    parts = decodeTransactionData(data);
                    hexCollectionName = parts[2];
                    hexNFTNumber = parts[3];
                    price = microCurrencyToCurrency(tx.value);
                    currency = 'EGLD';
                }

                collection = hexToString(hexCollectionName);
                number = hexToDecimal(hexNFTNumber);
                //console.log(`New item bought - https://www.trust.market/nft/${collection}-${hexNFTNumber} - ${price} ${currency}`);
                await removeFromDb(number, collection);
                break;
            case 'listing':
                parts = decodeTransactionData(tx.data);
                hexCollectionName = parts[1];
                hexNFTNumber = parts[2];
                price = microCurrencyToCurrency(hexToDecimal(parts[7]));
                currency = hexToString(parts[9]);

                collection = hexToString(hexCollectionName);
                number = hexToDecimal(hexNFTNumber);
                //console.log(`Listing - https://www.trust.market/nft/${collection}-${hexNFTNumber} - ${price} ${currency}`)
                await addToDb(number, collection, price, tx.timestamp, tx.txHash, currency);
                break;
            case 'withdraw':
                break;
            case 'changePrice':
                topics = tx.logs.events[0].topics;
                collection = decodeBase64(topics[1]);
                hexNFTNumber = base64ToHex(topics[2]);
                number = hexToDecimal(hexNFTNumber);
                currency = decodeBase64(topics[7]);
                price = microCurrencyToCurrency(hexToDecimal(base64ToHex(topics[6])));
                //console.log(`Price change - https://www.trust.market/nft/${collection}-${hexNFTNumber} - ${price} ${currency}`)
                await addToDb(number, collection, price, tx.timestamp, tx.txHash, currency);
                break;
            case 'sendOffer':
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
                let event = tx.logs.events.find(i => i.identifier === 'acceptOffer');
                if (event) {
                    topics = event.topics;
                    collection = decodeBase64(topics[1]);
                    hexNFTNumber = base64ToHex(topics[2]);
                    number = hexToDecimal(hexNFTNumber);
                    price = microCurrencyToCurrency(hexToDecimal(base64ToHex(topics[7])));
                    currency = decodeBase64(topics[5]);
                } else {
                    parts = decodeTransactionData(tx.data);
                    hexCollectionName = parts[1];
                    hexNFTNumber = parts[2];
                    collection = hexToString(hexCollectionName);
                    number = hexToDecimal(hexNFTNumber);
                }
                //console.log(`Offer accepted - https://www.trust.market/nft/${collection}-${hexNFTNumber} - ${price} ${currency}`)
                await removeFromDb(number, collection);
                break;
            default:
                addToLogSystem('unsupported transaction')
                addToLogSystem(JSON.stringify(tx));
                break;
        }
    } catch (e) {
        addToLogErrorSystem('TX analysis thrown');
        addToLogErrorSystem(JSON.stringify(tx));
    }
}

const setLastTransactionAnalyzed = async (tx) => {
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