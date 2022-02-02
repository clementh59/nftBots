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

/**
 *
 * @param {string} name - needs to be a name coming from the collectionHandled part of the config file for consistency
 * @return {string} the contract corresponding to the name - the name if the address isn't registered in the config
 */
export const getContractWithCollectionName = (name) => {
    if (config.contracts[name])
        return config.contracts[name];
    return name;
}

/**
 *
 * @param {string} contractAddress
 * @return {string} the name corresponding to the address - the address if the address isn't registered in the config
 */
export const getCollectionNameWithContract = (contractAddress) => {
    for (let key in config.contracts) {
        if (config.contracts[key] === contractAddress)
            return key;
    }
    return contractAddress;
}

/**
 *
 * @param {string} contract
 */
export const getCollectionConfigFromContract = (contract) => {
    // 1. get the name of the collection
    let name = '';

    for (let key in config.contracts) {
        if (config.contracts[key] === contract)
            name = key;
    }

    if (!name.length)
        return config.collectionHandled.find(i => i.name === 'default');

    // 2. return the config from the collection name
    return config.collectionHandled.find(i => i.name === name);
}
