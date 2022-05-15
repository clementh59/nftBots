import {addHistoryEntryToItem, deleteItem, retrieveItems, upsertItem} from "../terraDB.js";
import {getCollectionNameWithContract, getLastTransactions} from "../terraUtils.js";
import {addToLogErrorSystem, addToLogSystem} from "../../logSystem.js";
import {priceInLuna, retrieveAndAnalyzeTxs, priceInUst} from "../../utils.js";
import {createRequire} from "module";
import {
    getLastTransactionIdAnalyzedLuart,
    setLastTransactionAnalyzedLuart
} from "../infoAndStatusDB/infoAndStatusDB.js";
import {analyzeSales} from "../../algorithm/analysisAlgorithm.js";
const require = createRequire(import.meta.url);
const config = require("../config.json");

//region db

/**
 * Add the event to DB
 * @param {{}} info
 * @param {string} contractAddress
 */
const addToDB = async (info, contractAddress) => {
    await upsertItem('luart', {order_id: info.order_id}, {
        order_id: info.order_id,
        contractAddress: contractAddress,
        token_id: info.id,
    });

    const values = {
        token_id: info.id,
        order: config.constants.order.SALE,
        marketplace: 'luart',
        owner: info.seller,
        order_id: info.order_id,
        status: {
            expiration: info.expiration,
        },
    }

    if (info.price)
        values.price =  info.price;
    if (info.priceUst)
        values.priceUst = info.priceUst;

    await upsertItem(getCollectionNameWithContract(contractAddress), {'token_id': info.id}, values);
}

/**
 * Remove the event from DB
 * @param {{}} info
 */
const removeFromDB = async (info) => {
    // any change here needs to be changed also in removeRandomEarthExpiredSales() for consistency when removing events

    // first, I retrieve the info from the order_id in the luart db
    try {
        const {token_id, contractAddress} = (await retrieveItems('luart', {order_id: info.order_id}, 1))[0];

        if (!info.cancel) {
            // add to history
            const res = (await retrieveItems(getCollectionNameWithContract(contractAddress), {token_id: token_id}, 1))[0];

            const obj = {
                marketplace: 'luart',
                owner: res.owner,
                isBid: false,
                tx: info.tx,
                date: info.date
            };

            if (res.price)
                obj.price = res.price;
            else if (res.priceUst)
                obj.price = res.priceUst;

            await addHistoryEntryToItem(getCollectionNameWithContract(contractAddress), {'token_id': token_id}, obj);
        }

        const update = {
            token_id: token_id,
            order: config.constants.order.NONE,
        }

        if (info.newOwner)
            update.owner = info.newOwner;

        await upsertItem(getCollectionNameWithContract(contractAddress), {'token_id': token_id}, update, {
            marketplace: "",
            price: "",
            status: "",
            order_id: ""
        });
        deleteItem('luart', {order_id: info.order_id});
    } catch (e) {

    }
}

// todo: remove expired sales
//endregion

//region tx analysis
const analyzeLuartOrder = async (tx, key, order) => {

    if (order.token_id === '267097543635769062784186731983913667522')
        console.log(order);

    const addErrorToLog = () => {
        addToLogErrorSystem(JSON.stringify(tx));
        addToLogErrorSystem(key);
        addToLogErrorSystem(JSON.stringify(order));
        addToLogErrorSystem('\n');
    }

    switch (key) {
        case 'approve':
            break;
        case 'post_sell_order':
            if (order.denom === 'uluna') {
                await addToDB({
                    expiration: order.expiration,
                    price: priceInLuna(order.price),
                    order_id: order.order_id,
                    id: order.token_id,
                    seller: order.sender,
                }, order.nft_contract_address);
            } else if (order.denom === 'uusd') {
                await addToDB({
                    expiration: order.expiration,
                    priceUst: priceInUst(order.price),
                    order_id: order.order_id,
                    id: order.token_id,
                    seller: order.sender,
                }, order.nft_contract_address);
            }
            break;
        case 'post_buy_order':
            // offer
            break;
        case 'execute_order':
            if (order.order_id.startsWith('sell')) {
                await removeFromDB({
                    order_id: order.order_id,
                    newOwner: order.sender,
                    tx: tx.txhash,
                    date: tx.timestamp,
                });
            } else {
                addErrorToLog()
            }
            break;
        case 'cancel_order':
            if (order.order_id.startsWith('sell')) {
                await removeFromDB({
                    order_id: order.order_id,
                    newOwner: order.sender,
                    cancel: true,
                });
            } else {
                addErrorToLog()
            }
            break;
        case 'add_balance':
            break;
        default:
            addErrorToLog()
            break;
    }
}

const tryAnalyzingTxSolution1 = async (tx, msg) => {
    try {
        for (let key in msg.value.execute_msg) {
            msg.value.execute_msg[key].sender = msg.value.sender;
            await analyzeLuartOrder(tx, key, msg.value.execute_msg[key]);
        }

        return true;
    } catch (e) {
        console.log(e)
        return false;
    }
}

export const analyzeLuartTransaction = async (tx) => {
    await Promise.all(tx.tx.value.msg.map(async (msg) => {
        let res = await tryAnalyzingTxSolution1(tx, msg);
        if (!res) {
            await addToLogSystem(JSON.stringify(tx));
        }
    }));
}
//endregion

const getLastTxs = async (offset) => {
    return getLastTransactions(config.contracts.luart, offset, offset ? 100 : 10)
}

/**
 * The function that is called when db is up to date with the blockchain
 * @returns {Promise<void>}
 */
const endOfLoopTreatment = async () => {
    //await removeRandomEarthExpiredSales();
    //await analyzeSales(contractsUpdated);
    //contractsUpdated = [];
}

export const luartBot = async () => {
    //const lastTxAnalyzed = await getLastTransactionIdAnalyzedLuart();
    const lastTxAnalyzed = 0;
        retrieveAndAnalyzeTxs({
        "getLastTransactions": getLastTxs,
        "analyzeTransaction": analyzeLuartTransaction,
        "lastTransactionIdAnalyzed": lastTxAnalyzed,
        "setLastTransactionAnalyzed": setLastTransactionAnalyzedLuart,
        "instance": "Luart",
        "timeBetweenRequests": config.timeBetweenTerraFinderRequests,
        "endOfLoopTreatment": endOfLoopTreatment,
    }, 0);
}