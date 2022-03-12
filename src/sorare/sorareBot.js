import {initPriceFeed} from "./ethPriceFeed.js";
import {startCableSubscription} from "./sorareWebSocketConnection.js";

export const sorareBot = async () => {
    await initPriceFeed();
    startCableSubscription();
}

sorareBot();
