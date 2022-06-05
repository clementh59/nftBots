import {openURLInChrome} from "../../utils.js";
import {buildUrlFromDbItem} from "../elrondUtils.js";
import {addToLogSystem} from "../../logSystem.js";

export const buy = (item, collection, message) => {
    addToLogSystem(message);
    //openURLInChrome(buildUrlFromDbItem(item, collection));
}