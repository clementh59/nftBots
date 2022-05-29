import {openURLInChrome} from "../../utils.js";
import {buildTrustMarketUrlFromDbItem} from "../elrondUtils.js";
import {addToLogSystem} from "../../logSystem.js";

export const buy = (item, collection, message) => {
    console.log(message);
    addToLogSystem(message);
    openURLInChrome(buildTrustMarketUrlFromDbItem(item, collection));
}

buy();