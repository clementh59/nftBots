import {rates} from "./services/priceRateService.js";
import {addToLogErrorSystem, addToLogSystem} from "../logSystem.js";
import {initConnection, retrieveCheapestItems, retrieveCheapestItemsIncludingAllCurrencies} from "./db/elrondDB.js";
import {buy} from "./actions/autoBuy.js";
import {areAllMarketplacesUpToDate} from "./services/coordinator.js";
import {createRequire} from "module";
const require = createRequire(import.meta.url);
const config = require("./config.json");

/**
 * Analyze all DB to check if smthg is interesting
 * @param {[string]} collections - the contract addresses of collections - NOT NAMES
 */
export const analyzeSales = async (collections) => {

    const dbIsReady = await areAllMarketplacesUpToDate();

    if (!dbIsReady)
        return;

    if (
        rates.EGLD === -1
        || rates.RIDE === -1
        || !rates.EGLD
        || !rates.RIDE
    ) {
        console.log('The price rates are not loaded!!');
        return;
    }

    const promises = [];
    collections = [...new Set(collections)];
    for (let i = 0; i < collections.length; i++) {
        promises.push(analyzeCollection(collections[i]));
    }
    await Promise.all(promises);
}

const analyzeCollection = async (collectionName) => {

    const cheapestItems = await retrieveCheapestItemsIncludingAllCurrencies(collectionName, 50);

    if (cheapestItems.length < 50)
        return;

    const collectionConfig = config.collectionHandled.find(i => i.name === collectionName);

    if (!collectionConfig)
        return;

    const triggerFactorLevel = collectionConfig.triggerFactor;
    const triggerFactor = config.triggerScale[triggerFactorLevel];
    const minBenefInEGLD = config.minBenefInEGLD;

    // step 1 - check if a very cheap item has been listed
    if (cheapestItems[0].priceInEGLD <= cheapestItems[1].priceInEGLD * triggerFactor && (cheapestItems[1].priceInEGLD - cheapestItems[0].priceInEGLD) > minBenefInEGLD) {
        await buy(cheapestItems[0], collectionName, `Buying ${cheapestItems[0].name ? cheapestItems[0].name : collectionName} at ${cheapestItems[0].priceInEGLD} because floor is ${cheapestItems[1].priceInEGLD}`);
    } else {
        addToLogSystem(`${collectionName} - No (1) - ${cheapestItems[0].priceInEGLD} > ${cheapestItems[1].priceInEGLD * triggerFactor}`);
    }
}

/*(async () => {
    await initConnection();
    analyzeCollection("GUARDIAN-3d6635");
})();*/