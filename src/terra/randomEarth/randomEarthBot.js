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
/**
 *
 * @param {{}} msg - the msg contained in the tx that listed the item. e.g:
 * {
    "type": "wasm/MsgExecuteContract",
    "value": {
        "coins": [],
        "sender": "terra19umuhxv5nlw70rsfq2434p6k3t5t334e28aszt",
        "contract": "terra1eek0ymmhyzja60830xhzm7k7jkrk99a60q2z2t",
        "execute_msg": {"ledger_proxy": {"msg": "{\"post_order\":{\"order\":{\"order\":{\"listing\":0,\"maker\":[116,101,114,114,97,49,57,117,109,117,104,120,118,53,110,108,119,55,48,114,115,102,113,50,52,51,52,112,54,107,51,116,53,116,51,51,52,101,50,56,97,115,122,116],\"maker_fee\":\"0\",\"taker_fee\":\"0\",\"version\":\"terra1eek0ymmhyzja60830xhzm7k7jkrk99a60q2z2t\",\"taker\":\"terra1eek0ymmhyzja60830xhzm7k7jkrk99a60q2z2t\",\"maker_asset\":{\"info\":{\"nft\":{\"contract_addr\":\"terra103z9cnqm8psy0nyxqtugg6m7xnwvlkqdzm4s4k\",\"token_id\":\"186342927313358016758879959494165278263\"}},\"amount\":\"1\"},\"taker_asset\":{\"info\":{\"native_token\":{\"denom\":\"uluna\"}},\"amount\":\"95000000\"},\"fee_recipient\":\"accepting_counters\",\"nonce\":77076119,\"expiration\":1643010523},\"sig\":[]}}}"}}
    }
  }
 * @returns {{}} the execute order. e.g:
 * {"ledger_proxy":{"msg":{"execute_order":{"order":{"order":{"listing":0,"maker":[116,101,114,114,97,49,57,117,109,117,104,120,118,53,110,108,119,55,48,114,115,102,113,50,52,51,52,112,54,107,51,116,53,116,51,51,52,101,50,56,97,115,122,116],"maker_fee":"0","taker_fee":"0","version":"terra1eek0ymmhyzja60830xhzm7k7jkrk99a60q2z2t","taker":"terra1eek0ymmhyzja60830xhzm7k7jkrk99a60q2z2t","maker_asset":{"info":{"nft":{"contract_addr":"terra103z9cnqm8psy0nyxqtugg6m7xnwvlkqdzm4s4k","token_id":"186342927313358016758879959494165278263"}},"amount":"1"},"taker_asset":{"info":{"native_token":{"denom":"uluna"}},"amount":"95000000"},"expiration":1643010523,"fee_recipient":"accepting_counters","nonce":77076119},"sig":[]}}}}}
 */
export const generateBuyOrderRandomEarth = (msg) => {
    try {
        return generateBuyOrderFromPostOrder(msg);
    } catch (e) {
        return generateBuyOrderFromSendNFT(msg);
    }
}

const executeOrderSkeleton = {
    "ledger_proxy": {
        "msg": {
            "execute_order": {
                "order": {
                    "order": {
                        "listing": null,
                        "maker": null,
                        "maker_fee": null,
                        "taker_fee": null,
                        "version": null,
                        "taker": null,
                        "maker_asset": null,
                        "taker_asset": null,
                        "expiration": null,
                        "fee_recipient": null,
                        "nonce": null
                    },
                    "sig": null
                }
            }
        }
    }
}

/**
 *
 * @param {{}} postOrder - the post order of the item. e.g:
 * {
    "type": "wasm/MsgExecuteContract",
    "value": {
        "coins": [],
        "sender": "terra19umuhxv5nlw70rsfq2434p6k3t5t334e28aszt",
        "contract": "terra1eek0ymmhyzja60830xhzm7k7jkrk99a60q2z2t",
        "execute_msg": {"ledger_proxy": {"msg": "{\"post_order\":{\"order\":{\"order\":{\"listing\":0,\"maker\":[116,101,114,114,97,49,57,117,109,117,104,120,118,53,110,108,119,55,48,114,115,102,113,50,52,51,52,112,54,107,51,116,53,116,51,51,52,101,50,56,97,115,122,116],\"maker_fee\":\"0\",\"taker_fee\":\"0\",\"version\":\"terra1eek0ymmhyzja60830xhzm7k7jkrk99a60q2z2t\",\"taker\":\"terra1eek0ymmhyzja60830xhzm7k7jkrk99a60q2z2t\",\"maker_asset\":{\"info\":{\"nft\":{\"contract_addr\":\"terra103z9cnqm8psy0nyxqtugg6m7xnwvlkqdzm4s4k\",\"token_id\":\"186342927313358016758879959494165278263\"}},\"amount\":\"1\"},\"taker_asset\":{\"info\":{\"native_token\":{\"denom\":\"uluna\"}},\"amount\":\"95000000\"},\"fee_recipient\":\"accepting_counters\",\"nonce\":77076119,\"expiration\":1643010523},\"sig\":[]}}}"}}
    }
  }
 * @returns {{}} the execute order. e.g:
 * {"ledger_proxy":{"msg":{"execute_order":{"order":{"order":{"listing":0,"maker":[116,101,114,114,97,49,57,117,109,117,104,120,118,53,110,108,119,55,48,114,115,102,113,50,52,51,52,112,54,107,51,116,53,116,51,51,52,101,50,56,97,115,122,116],"maker_fee":"0","taker_fee":"0","version":"terra1eek0ymmhyzja60830xhzm7k7jkrk99a60q2z2t","taker":"terra1eek0ymmhyzja60830xhzm7k7jkrk99a60q2z2t","maker_asset":{"info":{"nft":{"contract_addr":"terra103z9cnqm8psy0nyxqtugg6m7xnwvlkqdzm4s4k","token_id":"186342927313358016758879959494165278263"}},"amount":"1"},"taker_asset":{"info":{"native_token":{"denom":"uluna"}},"amount":"95000000"},"expiration":1643010523,"fee_recipient":"accepting_counters","nonce":77076119},"sig":[]}}}}}
 */
const generateBuyOrderFromPostOrder = (postOrder) => {
    let order = JSON.parse(JSON.stringify(executeOrderSkeleton)); // to use a copy of the skeleton
    const msg = order.ledger_proxy.msg.execute_order.order;
    const postOrderMsg = JSON.parse(postOrder.value.execute_msg.ledger_proxy.msg).post_order.order;

    msg.sig = postOrderMsg.sig;
    msg.order.listing = postOrderMsg.order.listing;
    msg.order.maker = postOrderMsg.order.maker;
    msg.order.maker_fee = postOrderMsg.order.maker_fee;
    msg.order.taker = postOrderMsg.order.taker;
    msg.order.taker_fee = postOrderMsg.order.taker_fee;
    msg.order.version = postOrderMsg.order.version;
    msg.order.maker_asset = postOrderMsg.order.maker_asset;
    msg.order.taker_asset = postOrderMsg.order.taker_asset;
    msg.order.expiration = postOrderMsg.order.expiration;
    msg.order.fee_recipient = postOrderMsg.order.fee_recipient;
    msg.order.nonce = postOrderMsg.order.nonce;

    order.ledger_proxy.msg = JSON.stringify(order.ledger_proxy.msg);

    return order;
}

/**
 *
 * @param {{}} _msg - the post order of the item. e.g:
 * {
    "type": "wasm/MsgExecuteContract",
    "value": {
        "coins": [],
        "sender": "terra19umuhxv5nlw70rsfq2434p6k3t5t334e28aszt",
        "contract": "terra1eek0ymmhyzja60830xhzm7k7jkrk99a60q2z2t",
        "execute_msg": "send_nft": {
                "msg": "eyJwb3N0X29yZGVyIjp7Im9yZGVyIjp7Im9yZGVyIjp7Imxpc3RpbmciOjAsIm1ha2VyIjpbMTE2LDEwMSwxMTQsMTE0LDk3LDQ5LDEwNiwxMDYsMTA4LDExOSw1NSwxMTcsMTEyLDU2LDU0LDExMiwxMDYsMTE1LDExMCw1MiwxMTcsNTYsMTAyLDQ4LDEwMCwxMDQsMTIwLDEwOCw5Nyw1MywxMDEsMTAxLDEyMCwxMTcsMTIwLDQ4LDUwLDExOSw5OSw1MywxMTIsNTIsMTE2LDExOF0sIm1ha2VyX2ZlZSI6IjAiLCJ0YWtlcl9mZWUiOiIwIiwidmVyc2lvbiI6InRlcnJhMWVlazB5bW1oeXpqYTYwODMweGh6bTdrN2prcms5OWE2MHEyejJ0IiwidGFrZXIiOiJ0ZXJyYTFlZWsweW1taHl6amE2MDgzMHhoem03azdqa3JrOTlhNjBxMnoydCIsIm1ha2VyX2Fzc2V0Ijp7ImluZm8iOnsibmZ0Ijp7ImNvbnRyYWN0X2FkZHIiOiJ0ZXJyYTE2cnNzbmU4N2NrNnJzc2hnOThxcWo0eWxmdW00NmF4cDBrcGF6aiIsInRva2VuX2lkIjoiMzI0NzM5MzAyMTM3ODgwNTk4NDQzNjI3NzU2Njg1NTQ4MzMwNjYxIn19LCJhbW91bnQiOiIxIn0sInRha2VyX2Fzc2V0Ijp7ImluZm8iOnsibmF0aXZlX3Rva2VuIjp7ImRlbm9tIjoidWx1bmEifX0sImFtb3VudCI6IjM5MDAwMCJ9LCJmZWVfcmVjaXBpZW50IjoiYWNjZXB0aW5nX2NvdW50ZXJzIiwibm9uY2UiOjU0MDgzMDQ4LCJleHBpcmF0aW9uIjoxNjQ0Njg1MTE1fSwic2lnIjpbXX19fQ==",
                "contract": "terra1eek0ymmhyzja60830xhzm7k7jkrk99a60q2z2t",
                "token_id": "324739302137880598443627756685548330661"
            }
    }
  }
 * @returns {{}} the execute order. e.g:
 * {"ledger_proxy":{"msg":{"execute_order":{"order":{"order":{"listing":0,"maker":[116,101,114,114,97,49,57,117,109,117,104,120,118,53,110,108,119,55,48,114,115,102,113,50,52,51,52,112,54,107,51,116,53,116,51,51,52,101,50,56,97,115,122,116],"maker_fee":"0","taker_fee":"0","version":"terra1eek0ymmhyzja60830xhzm7k7jkrk99a60q2z2t","taker":"terra1eek0ymmhyzja60830xhzm7k7jkrk99a60q2z2t","maker_asset":{"info":{"nft":{"contract_addr":"terra103z9cnqm8psy0nyxqtugg6m7xnwvlkqdzm4s4k","token_id":"186342927313358016758879959494165278263"}},"amount":"1"},"taker_asset":{"info":{"native_token":{"denom":"uluna"}},"amount":"95000000"},"expiration":1643010523,"fee_recipient":"accepting_counters","nonce":77076119},"sig":[]}}}}}
 */
const generateBuyOrderFromSendNFT = (_msg) => {
    const sendNftMsg = _msg.value.execute_msg.send_nft;
    let buff = new Buffer.from(sendNftMsg.msg, 'base64');
    let base64Parsed = buff.toString('ascii');
    return generateBuyOrderFromPostOrder({
        value: {
            execute_msg: {
                ledger_proxy: {
                    msg: base64Parsed
                }
            }
        }
    });
}
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