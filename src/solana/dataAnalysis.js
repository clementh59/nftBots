import {createRequire} from "module";
import fetch from 'node-fetch';

const collectionToAnalyze = [
    "yaku_x",
    "okay_bears",
    "the_bridged",
    "solgods",
    "lizards",
]

const fetchCollectionActivity = async (collection) => {
    const res = await fetch(`https://api-mainnet.magiceden.io/rpc/getGlobalActivitiesByQuery?q=%7B%22%24match%22%3A%7B%22txType%22%3A%7B%22%24in%22%3A%5B%22exchange%22%2C%22acceptBid%22%2C%22auctionSettled%22%5D%7D%2C%22collection_symbol%22%3A%22${collection}%22%7D%2C%22%24sort%22%3A%7B%22blockTime%22%3A-1%2C%22createdAt%22%3A-1%7D%2C%22%24skip%22%3A0%7D`, {
        "headers": {
            "accept": "application/json, text/plain, */*",
            "accept-language": "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
            "sec-ch-ua": "\" Not A;Brand\";v=\"99\", \"Chromium\";v=\"101\", \"Google Chrome\";v=\"101\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"macOS\"",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-site",
            "Referer": "https://magiceden.io/",
            "Referrer-Policy": "strict-origin-when-cross-origin"
        },
        "body": null,
        "method": "GET"
    });
    return await res.json();
}

for (const n in collectionToAnalyze) {
    const collection = collectionToAnalyze[n];
    const data = await fetchCollectionActivity(collection);
    let found = 0;
    console.log(collection);
    for (let floor = 0.1; floor < 200; floor=floor*1.1) {
        const sales = data.results.filter(i => i.parsedTransaction?.total_amount/1000000000 < floor && i.txName === "buy_now");
        const length = sales.length - found;
        if (length && sales.length < 150)
            console.log(`${Math.round(floor*100)/100} Sol - ${length} sales`);
        found = sales.length;
    }
}

fetchCollectionActivity("yaku_x")

/*for (const dataKey in data.results) {
    console.log(data.results[dataKey].txName);
}*/