import fetch from 'node-fetch';
import {addToLogSystem} from "../logSystem.js";
import {timer} from "../utils.js";

const fetchLastTxs = async (offset) => {
    const res = await fetch("https://api.mintscan.io/v1/juno/wasm/contracts/juno177m3f78mg5cek8gf5xgea49vs32dt3d6f9dwmuxd3hez3nd7yzgq3ahufw/txs?limit=45&offset=135", {
        "headers": {
            "accept": "application/json, text/plain, */*",
            "accept-language": "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
            "sec-ch-ua": "\" Not A;Brand\";v=\"99\", \"Chromium\";v=\"101\", \"Google Chrome\";v=\"101\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"macOS\"",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-site",
            "Referer": "https://www.mintscan.io/",
            "Referrer-Policy": "strict-origin-when-cross-origin"
        },
        "body": null,
        "method": "GET"
    });
    return await res.json();
}

const analyzeTxs = (txs) => {
    for (let i = 0; i < txs.length; i++) {
        txs[i].data.tx.body.messages?.forEach((msg) => {
            if (msg.msg.hasOwnProperty('buy')){
                console.log(`${msg.msg.buy.token_id} bought for ${msg.funds[0].amount/1000000}`)
                addToLogSystem(`${msg.msg.buy.token_id} bought for ${msg.funds[0].amount/1000000}`)
            }
        })
    }
}

const main = async () => {
    let offset = 0;
    while (offset < 4000) {
        const r = await fetchLastTxs(offset);
        console.log(r);
        analyzeTxs(r.txs);
        offset += 45;
        await timer(2000);
        console.log(offset);
    }
}

main()