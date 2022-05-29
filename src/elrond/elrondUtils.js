import {fetchWithTimeout} from "../utils.js";

export const microCurrencyToCurrency = (micro) => {
    return micro / 1000000000000000000;
}

export const decodeBase64 = (data) => {
    let buff = Buffer.from(data, 'base64');
    return buff.toString('ascii');
}

export const base64ToHex = (data) => {
    let buff = Buffer.from(data, 'base64');
    return buff.toString('hex');
}

export const hexToString = (data) => {
    let buff = Buffer.from(data, 'hex');
    return buff.toString('ascii');
}

export const hexToDecimal = (hexString) => {
    return parseInt(hexString, 16);
}

export const decodeTransactionData = (data) => {
    let decodedData = decodeBase64(data);
    return decodedData.split('@');
}

export const getLastTransactions = async (contract, offset, amount) => {
    try {
        let res = await fetchWithTimeout(`https://api.elrond.com/accounts/${contract}/transactions?from=${offset}&size=${amount}&withScResults=true&withOperations=true&withLogs=true`, {
            "headers": {
                "accept": "application/json, text/plain, */*",
                "accept-language": "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "cross-site",
                "sec-gpc": "1"
            },
            "body": null,
            "method": "GET",
            "mode": "cors"
        }, 4000);
        return await res.json();
    } catch (e) {
        console.log(e);
        return getLastTransactions(contract, offset, amount);
    }
}