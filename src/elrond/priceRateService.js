import {fetchWithTimeout, timer} from "../utils.js";
const FIVE_MINUTES = 5*60*1000;
import fetch, {Headers} from 'node-fetch';
import {base64ToHex, decodeTransactionData, hexToDecimal, microCurrencyToCurrency} from "./elrondUtils.js";
export const rates = {
    "EGLD": -1,
    "RIDE": -1,
    "MEX": -1,
    "LK-MEX": -1
}

const loadLKMexPrice = async () => {
    try {
        const myHeaders = new Headers();
        myHeaders.append("Accept", "application/json, text/plain, */*");
        myHeaders.append("Accept-Language", "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7");
        myHeaders.append("Connection", "keep-alive");
        myHeaders.append("Content-Type", "application/json");
        myHeaders.append("Origin", "https://lockedmex.exchange");
        myHeaders.append("Referer", "https://lockedmex.exchange/");
        myHeaders.append("Sec-Fetch-Dest", "empty");
        myHeaders.append("Sec-Fetch-Mode", "cors");
        myHeaders.append("Sec-Fetch-Site", "cross-site");
        myHeaders.append("User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.4951.64 Safari/537.36");
        myHeaders.append("sec-ch-ua", "\" Not A;Brand\";v=\"99\", \"Chromium\";v=\"101\", \"Google Chrome\";v=\"101\"");
        myHeaders.append("sec-ch-ua-mobile", "?0");
        myHeaders.append("sec-ch-ua-platform", "\"macOS\"");

        const raw = JSON.stringify({
            "scAddress": "erd1qqqqqqqqqqqqqpgqmua7hcd05yxypyj7sv7pffrquy9gf86s535qxct34s",
            "funcName": "simulate_swap_token_to_lkmex",
            "args": [
                "4d45582d343535633537",
                "8ac7230489e80000"
            ],
            "value": "0"
        });

        const requestOptions = {
            method: 'POST',
            headers: myHeaders,
            body: raw,
            redirect: 'follow'
        };

        const res = await fetch("https://gateway.elrond.com/vm-values/query", requestOptions)
        const json = await res.json();
        const result = json.data.data.returnData;
        const mexPrice = hexToDecimal(base64ToHex(result[1]));
        const lkMexPrice = hexToDecimal(base64ToHex(result[0]));
        console.log(mexPrice/lkMexPrice)
        rates["LK-MEX"] = lkMexPrice/mexPrice * rates.MEX;
    } catch (e) {
        rates["LK-MEX"] = -1;
    }
}

const loadPriceRates = async () => {
    try {
        const res = await fetchWithTimeout(
            'https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest?slug=elrond,holoride,maiar', {
                headers: {
                    "X-CMC_PRO_API_KEY": "f7791dcd-973b-484e-84ed-5d2eba761b51",
                    "accept": "application/json"
                }
            },
            5000
        );
        const json = await res.json();
        if (json.status.error_code !== 0) {
            rates.EGLD = -1;
            rates.RIDE = -1;
            rates.MEX = -1;
            return;
        }
        Object.values(json.data).forEach((v) => {
            rates[v.symbol] = v.quote.USD.price;
        })
    } catch (e) {
        rates.EGLD = -1;
        rates.RIDE = -1;
        rates.MEX = -1;
    }
}

export const priceRateService = async () => {
    await timer(FIVE_MINUTES);
    await loadPriceRates();
    await loadLKMexPrice();
    console.log(rates)
}

priceRateService();