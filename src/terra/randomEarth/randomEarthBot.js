import {priceInLuna, retrieveAndAnalyzeTxs} from "../../utils.js";
import {getCollectionNameWithContract, getLastTransactions} from "../terraUtils.js";
import {createRequire} from "module";
import {
    getCollectionsName,
    updateItems,
    upsertItem
} from "../terraDB.js";
import {
    getLastTransactionIdAnalyzedRandomEarth,
    setLastTransactionAnalyzedRandomEarth
} from "../infoAndStatusDB/infoAndStatusDB.js";
import {addToLogSystem} from "../../logSystem.js";
import {analyzeSales} from "../../algorithm/analysisAlgorithm.js";

const require = createRequire(import.meta.url);
const config = require("../config.json");

let contractsUpdated = []; // to know which collections have been updated before an analysis so that we don't have to
// analyze all collections

//region auto-buy features

//endregion

//region db
/**
 * Add the event to DB
 * @param {{}} info
 * @param {string} contractAddress
 */
const addToDB = async (info, contractAddress) => {
    await upsertItem(getCollectionNameWithContract(contractAddress), {'token_id': info.id}, {
        token_id: info.id,
        order: config.constants.order.SALE,
        marketplace: 'randomEarth',
        price: info.price,
        owner: info.seller,
        status: {
            date: info.date,
            expiration: info.expiration,
            msg: info.msg,
        },
    });
}

/**
 * Remove the event from DB
 * @param {{}} info
 * @param {string} contractAddress
 */
const removeFromDB = async (info, contractAddress) => {
    // any change here needs to be changed also in removeRandomEarthExpiredSales() for consistency when removing events

    const update = {
        token_id: info.id,
        order: config.constants.order.NONE,
    }

    if (info.owner)
        update.owner = info.owner;

    await upsertItem(getCollectionNameWithContract(contractAddress), {'token_id': info.id}, update, {
        marketplace: "",
        price: "",
        status: ""
    });
}

/**
 * Update the db to remove the expired sales
 * @returns {Promise<void>}
 */
const removeRandomEarthExpiredSales = async () => {
    const collections = await getCollectionsName();
    for (let i = 0; i < collections.length; i++) {
        const now = new Date().getTime() / 1000;

        // any change here needs to be changed also in removeFromDB() for consistency when removing events
        await updateItems(collections[i], {'status.expiration': {$lt: now}, 'marketplace': 'randomEarth'}, {
            order: config.constants.order.NONE,
        }, {marketplace: "", price: "", status: ""});
    }
}
//endregion db

//region tx analysis
/**
 * Get the price in luna from the taker asset info
 * @param takerAsset
 * @returns {number}
 */
const getPriceInLuna = (takerAsset) => {
    try {
        switch (takerAsset.info.native_token.denom) {
            case 'uluna':
                return priceInLuna(takerAsset.amount);
            default:
                return -1;
        }
    } catch (e) {
        return -1;
    }
}

const getInfoFromMakerAndTakerAsset = async (tx, msg, makerAsset, takerAsset) => {
    const priceInLuna = getPriceInLuna(takerAsset);
    const nft = makerAsset.info.nft;
    let info = {};
    info.id = nft.token_id;
    info.price = priceInLuna;
    info.date = tx.timestamp;
    info.tx = tx.id;
    info.msg = msg;
    return info;
}

const newItemSold = async (tx, msg, makerAsset, takerAsset, method) => {
    let info = await getInfoFromMakerAndTakerAsset(tx, msg, makerAsset, takerAsset);
    if (!info)
        return null;
    info.saleType = method;
    info.buyer = msg.value.sender;
    return info;
}

const newSale = async (tx, msg, makerAsset, takerAsset, order) => {
    let info = await getInfoFromMakerAndTakerAsset(tx, msg, makerAsset, takerAsset);
    if (!info)
        return null;
    info.seller = msg.value.sender;
    info.expiration = order.expiration;
    return info;
}

const analyzeRandomEarthOrder = async (tx, key, order, msg) => {
    let makerAsset, takerAsset, nft;
    let str = '';
    let info = {};

    switch (key) {
        case 'post_order':
            if (order.maker_asset.info.nft) {
                str += `New listing! `
                makerAsset = order.maker_asset;
                takerAsset = order.taker_asset;
            } else {
                str += `New bid! `
                makerAsset = order.taker_asset;
                takerAsset = order.maker_asset;
                return;
            }
            info = await newSale(tx, msg, makerAsset, takerAsset, order);
            if (!info)
                return;
            nft = makerAsset.info.nft;
            await addToDB(info, nft.contract_addr);
            contractsUpdated.push(nft.contract_addr);
            break;
        case 'withdraw':
            break;
        case 'cancel_order':
            if (order.maker_asset.info.nft) {
                makerAsset = order.maker_asset;
                takerAsset = order.taker_asset;
            } else {
                makerAsset = order.taker_asset;
                takerAsset = order.maker_asset;
            }
            await removeFromDB({
                id: makerAsset.info.nft.token_id,
                price: getPriceInLuna(takerAsset)
            }, makerAsset.info.nft.contract_addr);
            break;
        case 'deposit':
            break;
        case 'execute_order':
            if (order.maker_asset.info.nft) {
                str = 'direct'
                makerAsset = order.maker_asset;
                takerAsset = order.taker_asset;
            } else {
                str = 'bid';
                makerAsset = order.taker_asset;
                takerAsset = order.maker_asset;
            }
            info = await newItemSold(tx, msg, makerAsset, takerAsset, str);
            if (!info)
                return;
            nft = makerAsset.info.nft;
            await removeFromDB(info, nft.contract_addr);
            break;
    }
}

/**
 * RandomEarth case
 * This case is if the NFT was already in the RandomEarth SmartContract
 * @returns {Promise<boolean>} - true if if was this kind of tx - false otherwise
 */
const tryAnalyzingTxSolution1 = async (tx, msg) => {
    try {
        for (let key in JSON.parse(msg.value.execute_msg.ledger_proxy.msg)) {
            const order = JSON.parse(msg.value.execute_msg.ledger_proxy.msg)[key].order.order;
            await analyzeRandomEarthOrder(tx, key, order, msg);
        }

        return true;
    } catch (e) {
        return false;
    }
}

/**
 * RandomEarth case
 * This case is if the guy interacted with the contract while the NFT was in his wallet and not in RE contract
 * @returns {Promise<boolean>} - true if if was this kind of tx - false otherwise
 */
const tryAnalyzingTxSolution2 = async (tx, msg) => {

    try {
        for (let key in msg.value.execute_msg) {
            switch (key) {
                case 'send_nft':
                    let buff = new Buffer.from(msg.value.execute_msg.send_nft.msg, 'base64');
                    let decoded = buff.toString('ascii');
                    const r = JSON.parse(decoded);
                    for (key in r) {
                        await analyzeRandomEarthOrder(tx, key, r[key].order.order, msg)
                    }
                    break;
                default:
                    return false;
            }
        }
        return true;
    } catch (e) {
        return false;
    }
}

/**
 * RandomEarth case
 * This case is if the guy withdrawn or deposit in RE contract
 * Or setting royalty on a contract
 * @returns {Promise<boolean>} - true if if was this kind of tx - false otherwise
 */
const tryAnalyzingTxSolution3 = async (tx, msg) => {
    try {
        return msg.value.execute_msg.hasOwnProperty('withdraw') ||
            msg.value.execute_msg.hasOwnProperty('deposit') ||
            msg.value.execute_msg.hasOwnProperty('set_royalty') ||
            msg.value.execute_msg.hasOwnProperty('transfer_nft');
    } catch (e) {
        return false;
    }
}

export const analyzeRandomEarthTransaction = async (tx) => {
    await Promise.all(tx.tx.value.msg.map(async (msg) => {
        let res = await tryAnalyzingTxSolution1(tx, msg);
        if (!res)
            res = await tryAnalyzingTxSolution2(tx, msg);
        if (!res)
            res = await tryAnalyzingTxSolution3(tx, msg);
        if (!res) {
            await addToLogSystem(JSON.stringify(tx));
        }
    }));
}
//endregion

const getLastTxs = async (offset) => {
    return getLastTransactions(config.contracts.randomEarth, offset, offset ? 100 : 10)
}

/**
 * The function that is called when db is up to date with the blockchain
 * @returns {Promise<void>}
 */
export const endOfLoopTreatment = async () => {
    await removeRandomEarthExpiredSales();
    await analyzeSales(contractsUpdated);
    contractsUpdated = [];
}

export const randomEarthBot = async () => {
    const lastTxAnalyzed = await getLastTransactionIdAnalyzedRandomEarth();
    retrieveAndAnalyzeTxs({
        "getLastTransactions": getLastTxs,
        "analyzeTransaction": analyzeRandomEarthTransaction,
        "lastTransactionIdAnalyzed": lastTxAnalyzed,
        "setLastTransactionAnalyzed": setLastTransactionAnalyzedRandomEarth,
        "instance": "RandomEarth",
        "timeBetweenRequests": config.timeBetweenTerraFinderRequests,
        "endOfLoopTreatment": endOfLoopTreatment,
    }, 0);
}