import {sendMail} from "../utils.js";
import {getCollectionConfigFromContract, getCollectionNameWithContract} from "../terra/terraUtils.js";
import {retrieveCheapestItems, retrieveCheapestItemsUnderRank, retrieveNumberOfItems} from "../terra/terraDB.js";
import {createRequire} from "module";
import {addToLogSystem} from "../logSystem.js";

const require = createRequire(import.meta.url);
const config = require("../terra/config.json");

export const ANALYSIS_CODES = {
    CONFIG_SET_TO_NOT_BUY: 0,
    NOT_ENOUGH_DATA_POINTS: 1,
    NOT_BUYING: 2,
}

let itemBought = [];

/**
 *
 * @param {number} priceOfRareItem
 * @param {number} floor
 * @param {number} iteration
 * @returns {boolean} true if it is a nft to buy - false otherwise
 */
const rareItemPriceIsTooLow = (priceOfRareItem, floor, iteration) => {
    let factor = 1.1;
    switch (iteration) {
        case 1:
            factor = 1.25;
            break;
        case 2:
            factor = 1.4;
            break;
        case 3:
            factor = 1.55;
            break;
        case 4:
            factor = 1.7;
            break;
    }
    return priceOfRareItem < floor * factor;
}

/**
 * Analyze all DB to check if smthg is interesting
 * @param {[string]} collections - the contract addresses of collections - NOT NAMES
 */
export const analyzeSales = async (collections) => {
    const promises = [];
    collections = [...new Set(collections)];
    console.log(collections)
    for (let i = 0; i < collections.length; i++) {
        const config = getCollectionConfigFromContract(collections[i]);
        promises.push(analyzeCollection(collections[i], config));
    }
    await Promise.all(promises);
}

/**
 * Analyze a given collection
 * @param {string} contract - the contract address
 * @param {{}} collectionConfig - the collection config
 */
export const analyzeCollection = async (contract, collectionConfig) => {

    let res = [];
    let collectionName = getCollectionNameWithContract(contract);

    console.log(collectionName);
    console.log(collectionConfig);

    try {

        if (collectionConfig.buy === false)
            return [ANALYSIS_CODES.CONFIG_SET_TO_NOT_BUY];

        const cheapestItems = await retrieveCheapestItems(collectionName, {}, 60, 0);

        if (cheapestItems.length < 50)
            // we need at least this amount of item of that collection to estimate we can trust the market price
            return [ANALYSIS_CODES.NOT_ENOUGH_DATA_POINTS];

        const triggerFactorLevel = collectionConfig.triggerFactor;
        const triggerFactor = config.triggerScale[triggerFactorLevel];

        // step 1 - check if a very cheap item has been listed
        if (cheapestItems[0].price <= cheapestItems[1].price * triggerFactor) {
            await buy(contract, cheapestItems[0], `Buying ${cheapestItems[0].name} at ${cheapestItems[0].price} because floor is ${cheapestItems[1].price}`);
            res.push(cheapestItems[0]);
        } else {
            addToLogSystem(`${collectionName} - No (1) - ${cheapestItems[0].price} > ${cheapestItems[1].price * triggerFactor}`);
        }

        // step 2 - check if a rare item is close to the floor
        if (collectionConfig.rarityFactor) {
            const floor = cheapestItems[0].price;
            const numberOfItems = await retrieveNumberOfItems(collectionName);

            for (let i = 0; i < parseInt(collectionConfig.rarityFactor); i++) {
                const rarityFactor = config.rarityScale[parseInt(collectionConfig.rarityFactor)-i];
                const belowRank = numberOfItems * rarityFactor / 100;
                const rareItems = await retrieveCheapestItemsUnderRank(collectionName, {}, 1, 0, belowRank);
                if (rareItems.length > 0 && rareItemPriceIsTooLow(rareItems[0].price, floor, i)) {
                    await buy(contract, rareItems[0], `Buying ${rareItems[0].name} at ${rareItems[0].price} because floor is ${floor} and rarity is ${rareItems[0].rank*100/numberOfItems}%`);
                    res.push(rareItems[0]);
                }
            }
        }
    } catch (e) {
        console.log(e);
        // todo: push errors somewhere
    }

    if (!res.length)
        return [ANALYSIS_CODES.NOT_BUYING];

    return res;
}

/**
 * Auto buy an item and send a mail to alert me
 * @param {string} collection - coll address
 * @param {{}} item
 * @param msg - the object of the mail that will be sent
 */
const buy = async (collection, item, msg) => {
    console.log('enter buy');
    addToLogSystem('enter buy for: ' + item.toString());
    if (!itemBought.includes(collection + item.token_id + item.price)) {
        console.log(msg);
        addToLogSystem(msg);
        itemBought.push(collection + item.token_id + item.price);
        /*if (item.hasOwnProperty('msg')) {
            const res = await buyRandomEarth(item.msg, item.price);
            if (!res) {
                randomEarthBuyWithUI(item.link, terraPwd);
            }
        } else {
            randomEarthBuyWithUI(item.link, terraPwd);
        }*/

        //playMusic();

        //sendMail(text, collection + ' - ' + item.price);
    }
}