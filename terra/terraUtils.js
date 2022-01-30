import fetch from 'node-fetch';
import {fetchWithTimeout, timer} from "../utils.js";
import {createRequire} from "module";
const require = createRequire(import.meta.url);
export const config = require("./config.json")

export const getLastTransactions = async (contractAddress, offset = 0, limit = 10) => {
    try {
        let res = await fetchWithTimeout("https://fcd.terra.dev/v1/txs?offset=" + offset + "&limit=" + limit + "&account=" + contractAddress, {
            "headers": {
                "accept": "application/json, text/plain, */*",
                "accept-language": "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "cross-site",
                "sec-gpc": "1"
            },
            "referrer": "https://finder.terra.money/",
            "referrerPolicy": "strict-origin-when-cross-origin",
            "body": null,
            "method": "GET",
            "mode": "cors"
        }, 4000);
        const json = await res.json();
        return json.txs;
    } catch (e) {
        await timer(config.timeBetweenTerraFinderRequests);
        return await getLastTransactions(contractAddress, offset, limit);
    }
}

export const getLunaBalance = async (address) => {
    const res = await fetch("https://fcd.terra.dev/v1/staking/"+address, {
        "headers": {
            "accept": "application/json, text/plain, */*",
            "accept-language": "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "cross-site",
            "sec-gpc": "1"
        },
        "referrer": "https://finder.terra.money/",
        "referrerPolicy": "strict-origin-when-cross-origin",
        "body": null,
        "method": "GET",
        "mode": "cors"
    });

    const json = await res.json();
    return json.availableLuna/1000000;
}

export const getTx = async (txId) => {
    let res = await fetchWithTimeout("https://fcd.terra.dev/v1/tx/"+txId, {
        "headers": {
            "accept": "application/json, text/plain, */*",
            "accept-language": "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "cross-site",
            "sec-gpc": "1"
        },
        "referrer": "https://finder.terra.money/",
        "referrerPolicy": "strict-origin-when-cross-origin",
        "body": null,
        "method": "GET",
        "mode": "cors"
    }, 4000);
    const json = await res.json();
    return json.tx;
}
