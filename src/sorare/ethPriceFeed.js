import {getEthPriceNow} from 'get-eth-price';

const REFRESH_TIME_IN_MINUTES = 2;
let ethPrice;

export const initPriceFeed = async () => {
    await retrieveEthPrice();
    setInterval(() => {
        retrieveEthPrice();
    }, 1000*60*REFRESH_TIME_IN_MINUTES);
}

/**
 * Convert an ethAmount in a dollar amount
 * @param {number} ethAmount
 * @returns {number} the value in dollar (rounded to cents)
 */
export const getValueInUSD = (ethAmount) => {
    return Math.round(ethPrice*ethAmount*100)/100;
}

/**
 * Access an API to retrieve ETH price
 * @returns {Promise<void>}
 */
const retrieveEthPrice = async () => {
    const res = await getEthPriceNow();
    ethPrice = Object.values(res)[0].ETH.USD;
    console.log(`ETH price is now ${ethPrice}`);
}