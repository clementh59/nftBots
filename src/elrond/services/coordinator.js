import {
    isDeadRareUpToDate,
    isTrustMarketUpToDate,
} from "../db/infoAndStatusDB.js";

let cacheResult = false;

export const areAllMarketplacesUpToDate = async () => {
    if (!cacheResult) {
        return updateLocalState();
    } else {
        return cacheResult;
    }
}

const updateLocalState = async () => {
    const res = await Promise.all([
       isTrustMarketUpToDate(),
       isDeadRareUpToDate()
    ]);
    cacheResult = res[0] && res[1];
    return res[0] && res[1];
}