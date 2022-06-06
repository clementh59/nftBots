import {openURLInChrome} from "../../utils.js";
import {buildUrlFromDbItem} from "../elrondUtils.js";
import {addToLogSystem} from "../../logSystem.js";

const bought = [];

export const buy = (item, collection, message) => {
    if (!bought.includes(`${collection}-${item}`)) {
        addToLogSystem(message);
        bought.push(`${collection}-${item}`);
    }
    //openURLInChrome(buildUrlFromDbItem(item, collection));
}