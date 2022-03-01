import {sendMail} from "../utils.js";
import {getCollectionConfigFromContract, getCollectionNameWithContract} from "../terra/terraUtils.js";
import {
    retrieveCheapestItems,
    retrieveCheapestItemsUnderRank,
    retrieveCheapestItemsWithSpecialTrait,
    retrieveNumberOfItems
} from "../terra/terraDB.js";
import {createRequire} from "module";
import {addToLogSystem} from "../logSystem.js";
import {autoBuyItemRandomEarth} from "../terra/randomEarth/randomEarthBot.js";

const require = createRequire(import.meta.url);
const config = require("../terra/config.json");

export const ANALYSIS_CODES = {
    CONFIG_SET_TO_NOT_BUY: 0,
    NOT_ENOUGH_DATA_POINTS: 1,
    NOT_BUYING: 2,
    BUYING_IN_SPECIAL_FUNCTION: 3,
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
            await buy(contract, cheapestItems[0], `Buying ${cheapestItems[0].name ? cheapestItems[0].name : collectionName} at ${cheapestItems[0].price} because floor is ${cheapestItems[1].price}`);
            res.push(cheapestItems[0]);
        } else {
            addToLogSystem(`${collectionName} - No (1) - ${cheapestItems[0].price} > ${cheapestItems[1].price * triggerFactor}`);
        }

        const floor = cheapestItems[0].price;

        // step 2 - check if a rare item is close to the floor
        if (collectionConfig.rarityFactor && parseInt(collectionConfig.rarityFactor) !== 0) {
            const numberOfItems = await retrieveNumberOfItems(collectionName);

            for (let i = 0; i < parseInt(collectionConfig.rarityFactor); i++) {
                const rarityFactor = config.rarityScale[parseInt(collectionConfig.rarityFactor) - i];
                const belowRank = numberOfItems * rarityFactor / 100;
                const rareItems = await retrieveCheapestItemsUnderRank(collectionName, {}, 1, 0, belowRank);
                if (rareItems.length > 0 && rareItemPriceIsTooLow(rareItems[0].price, floor, i)) {
                    await buy(contract, rareItems[0], `Buying ${rareItems[0].name ? rareItems[0].name : collectionName} at ${rareItems[0].price} because floor is ${floor} and rarity is ${rareItems[0].rank * 100 / numberOfItems}%`);
                    res.push(rareItems[0]);
                }
            }
        }

        if (collectionToSpecialFunction[contract]) {
            const fieldsToAnalyze = collectionToSpecialFunction[contract];
            const promises = [];

            for (let i = 0; i < fieldsToAnalyze.length; i++) {
                promises.push(analyzeCustomFieldOfCollection(collectionName, fieldsToAnalyze[i], floor, contract));
            }

            if ((await Promise.all(promises)).includes(ANALYSIS_CODES.BUYING_IN_SPECIAL_FUNCTION))
                res.push(ANALYSIS_CODES.BUYING_IN_SPECIAL_FUNCTION);
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
 * Analyze a given field in a given collection to find if there is a cheap item
 * @param {string} collectionName
 * @param {{}} fieldToAnalyze
 * @param {number} floorValue - the actual floor of the collection
 * @param {string} contract
 * @returns {Promise<number>}
 */
const analyzeCustomFieldOfCollection = async (collectionName, fieldToAnalyze, floorValue, contract) => {
    const items = await retrieveCheapestItemsWithSpecialTrait(
        collectionName,
        {},
        1,
        0,
        fieldToAnalyze.trait_type,
        fieldToAnalyze.value
    );

    if (!fieldToAnalyze.maxFloorValueInCollectionFloor)
        fieldToAnalyze.maxFloorValueInCollectionFloor = 1000000;

    if (!fieldToAnalyze.triggerValue)
        fieldToAnalyze.triggerValue = 1000000;

    if (items.length
        && items[0].price <= fieldToAnalyze.triggerValue
        && items[0].price < (fieldToAnalyze.maxFloorValueInCollectionFloor * floorValue)) {
        await buy(contract, items[0], `Buying ${collectionName} at ${items[0].price} because it has ${fieldToAnalyze.value} as ${fieldToAnalyze.trait_type}`);
        return ANALYSIS_CODES.BUYING_IN_SPECIAL_FUNCTION;
    }
    return ANALYSIS_CODES.NOT_BUYING;
}

/**
 * Auto buy an item and send a mail to alert me
 * @param {string} contract - coll address
 * @param {{}} item
 * @param msg - the object of the mail that will be sent
 */
const buy = async (contract, item, msg) => {

    const isAMochaTest = typeof global.it === 'function';

    addToLogSystem('enter buy');

    if (isAMochaTest)
        return;

    if (!itemBought.includes(contract + item.token_id + item.price)) {
        console.log(msg);
        addToLogSystem(msg);
        itemBought.push(contract + item.token_id + item.price);
        if (item.hasOwnProperty('status')) {
            sendMail(msg, contract + ' - ' + item.price);
            await autoBuyItemRandomEarth(item.status.msg);
        }
    }
}

// Examples of fields to analyze:
// fieldsToAnalyze = [
//     {trait_type: 'body', value: 'yellow', triggerValue: 5, maxFloorValueInCollectionFloor: 3},
//     {trait_type: 'head', value: 'triangle', triggerValue: 30, maxFloorValueInCollectionFloor: 15}
// ]
//
// triggerValue is the maxValue in luna (below or equal)
//
// maxFloorValueInCollectionFloor is the max value in floor -> If the floor is 2.1 luna and maxFloorValueInCollectionFloor
// is set to 4, the algo won't buy above 8.4 luna this special trait.
const collectionToSpecialFunction = {
    'terra1f89xq3qhu98v4jch4y5xcrkhl9gytrne99x74t': [ // terrapins
        // assassins
        {trait_type: 'body', value: 'Assassins Cloak - Black', triggerValue: 6, maxFloorValueInCollectionFloor: 15},
        {trait_type: 'body', value: 'Assassins Cloak - White', triggerValue: 6, maxFloorValueInCollectionFloor: 15},
        {trait_type: 'head', value: 'Assassins Cowl - Black', triggerValue: 6, maxFloorValueInCollectionFloor: 15},
        {trait_type: 'head', value: 'Assassins Cowl - Black', triggerValue: 6, maxFloorValueInCollectionFloor: 15},
        // space suit
        {trait_type: 'body', value: 'Space Suit - Red', triggerValue: 17, maxFloorValueInCollectionFloor: 40},
        {trait_type: 'body', value: 'Space Suit - Blue', triggerValue: 17, maxFloorValueInCollectionFloor: 40},
        {trait_type: 'head', value: 'Astronaut Helmet - Clear', triggerValue: 17, maxFloorValueInCollectionFloor: 40},
        {trait_type: 'head', value: 'Astronaut Helmet - Black', triggerValue: 17, maxFloorValueInCollectionFloor: 40},

        // Dragon hats
        {trait_type: 'head', value: 'Dagon Hat - Purple - Laser', triggerValue: 10, maxFloorValueInCollectionFloor: 25},
        {trait_type: 'head', value: 'Dragon Hat - Green', triggerValue: 2, maxFloorValueInCollectionFloor: 4},
        {trait_type: 'head', value: 'Dragon Hat - Red', triggerValue: 2, maxFloorValueInCollectionFloor: 4},
        {trait_type: 'head', value: 'Dragon Hat - Purple', triggerValue: 2, maxFloorValueInCollectionFloor: 4},

        {trait_type: 'body', value: 'Genesis', triggerValue: 20, maxFloorValueInCollectionFloor: 40},
        {trait_type: 'body', value: 'Kimono', triggerValue: 1.9, maxFloorValueInCollectionFloor: 1.7},
        {trait_type: 'body', value: 'Kings Robe', triggerValue: 1.9, maxFloorValueInCollectionFloor: 1.7},
        {trait_type: 'body', value: 'Suit of Armour', triggerValue: 3, maxFloorValueInCollectionFloor: 2.5},
        {trait_type: 'eyes', value: 'Cyborg - Laser', triggerValue: 2.2, maxFloorValueInCollectionFloor: 2.5},
        {trait_type: 'eyes', value: 'Goggle Steam Punk - Laser', triggerValue: 2.6, maxFloorValueInCollectionFloor: 2.5},
        {trait_type: 'head', value: 'Plague Mask', triggerValue: 10, maxFloorValueInCollectionFloor: 20},
        {trait_type: 'head', value: 'Ape Hat', triggerValue: 2.2, maxFloorValueInCollectionFloor: 3},
        {trait_type: 'head', value: 'Pizza', triggerValue: 2, maxFloorValueInCollectionFloor: 3},
        {trait_type: 'head', value: 'Mohawk - Rainbow', triggerValue: 2, maxFloorValueInCollectionFloor: 3},
        {trait_type: 'head', value: 'Pylon Helmet', triggerValue: 10, maxFloorValueInCollectionFloor: 20},
        {trait_type: 'head', value: 'Knight Helmet - Blue', triggerValue: 2.5, maxFloorValueInCollectionFloor: 3.5},
        {trait_type: 'head', value: 'Knight Helmet - Red', triggerValue: 2.5, maxFloorValueInCollectionFloor: 3.5},
        {trait_type: 'head', value: 'Bunny Ears - Brown', triggerValue: 4, maxFloorValueInCollectionFloor: 6},
        {trait_type: 'head', value: 'Bunny Ears - White', triggerValue: 4, maxFloorValueInCollectionFloor: 6},
        {trait_type: 'skin', value: 'Zombie', triggerValue: 2.5, maxFloorValueInCollectionFloor: 4},
    ],
    'terra1trn7mhgc9e2wfkm5mhr65p3eu7a2lc526uwny2': [ // lunabulls
        // iced out
        {trait_type: 'outfit', value: 'Iced Out', triggerValue: 40, maxFloorValueInCollectionFloor: 10},
    ],
    'terraAnalysisTest': [ // useful for mocha tests
        {trait_type: 'body', value: 'rare', triggerValue: 5, maxFloorValueInCollectionFloor: 2}
    ],
};