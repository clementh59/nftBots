import {rates} from "./priceRateService.js";
import {addToLogErrorSystem, addToLogSystem} from "../logSystem.js";
import {retrieveCheapestItems} from "./elrondDB.js";
import {buildTrustMarketUrlFromDbItem} from "./elrondUtils.js";

/**
 * Analyze all DB to check if smthg is interesting
 * @param {[string]} collections - the contract addresses of collections - NOT NAMES
 */
export const analyzeSales = async (collections) => {
    if (
        rates.EGLD === -1
        || rates.RIDE === -1
        || !rates.EGLD
        || !rates.RIDE
    ) {
        await addToLogErrorSystem('The price rates are not loaded!!');
        return;
    }

    const promises = [];
    collections = [...new Set(collections)];
    addToLogSystem(collections);
    for (let i = 0; i < collections.length; i++) {
        promises.push(analyzeCollection(collections[i]));
    }
    await Promise.all(promises);
}

const analyzeCollection = async (collectionName) => {
    const cheapestItemsInEGLD = (await retrieveCheapestItems(collectionName, {
        currency: 'EGLD'
    })).map((i) => {
        return {
            ...i,
            priceInEGLD: i.price
        }
    });
    const cheapestItemsInLKMex = (await retrieveCheapestItems(collectionName, {
        currency: 'LKMEX-aab910'
    })).map((i) => {
        return {
            ...i,
            priceInEGLD: i.price * rates["LK-MEX"] / rates.EGLD,
        };
    });
    let cheapestItems = [
        ...cheapestItemsInLKMex,
        ...cheapestItemsInEGLD
    ];
    if (cheapestItems.length < 50)
        return;
    cheapestItems.sort((a,b) => a.priceInEGLD - b.priceInEGLD)

    const triggerFactor = 0.92;

    // step 1 - check if a very cheap item has been listed
    if (cheapestItems[0].price <= cheapestItems[1].price * triggerFactor) {
        await buy(cheapestItems[0], collectionName, `Buying ${cheapestItems[0].name ? cheapestItems[0].name : collectionName} at ${cheapestItems[0].price} because floor is ${cheapestItems[1].price}`);
        res.push(cheapestItems[0]);
    } else {
        addToLogSystem(`${collectionName} - No (1) - ${cheapestItems[0].price} > ${cheapestItems[1].price * triggerFactor}`);
    }
}

//analyzeSales(['EAPES-8f3c1f']);