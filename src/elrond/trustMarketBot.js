import {retrieveAndAnalyzeTxs} from "../utils.js";
import config from "./config.json";
import {getLastTransactions} from "./elrondUtils.js";
import {addToLogSystem} from "../logSystem.js";

const getLastTxs = async (offset) => {
    return getLastTransactions(config.contracts.trustMarket, offset, 50);
}

const analyzeTrustMarketTransaction = async (tx) => {

    if (tx.status === 'fail')
        return;

    let hexCollectionName, hexNFTNumber, price, currency, number, collection, data, parts, topics;

    switch (tx.function) {
        case 'buy':

            if (tx.action.category === 'esdtNft') {
                const args = tx.action.arguments;
                hexCollectionName = args.functionArgs[1];
                hexNFTNumber = args.functionArgs[2];
                price = microCurrencyToCurrency(args.transfers[0].value);
                currency = args.transfers[0].ticker;
                //todo: check if it is the real lkmex (not fake currencies)
            } else {
                data = tx.data;
                parts = decodeTransactionData(data);
                hexCollectionName = parts[2];
                hexNFTNumber = parts[3];
                price = microCurrencyToCurrency(tx.value);
                currency = 'EGLD';
            }

            collection = hexToString(hexCollectionName);
            number = hexToDecimal(hexNFTNumber);
            //console.log(`New item bought - https://www.trust.market/nft/${collection}-${hexNFTNumber} - ${price} ${currency}`);

            break;
        case 'listing':
            parts = decodeTransactionData(tx.data);
            hexCollectionName = parts[1];
            hexNFTNumber = parts[2];
            price = microCurrencyToCurrency(hexToDecimal(parts[7]));
            currency = hexToString(parts[9]);

            collection = hexToString(hexCollectionName);
            number = hexToDecimal(hexNFTNumber);
            //console.log(`Listing - https://www.trust.market/nft/${collection}-${hexNFTNumber} - ${price} ${currency}`)
            break;
        case 'withdraw':
            break;
        case 'changePrice':
            topics = tx.logs.events[0].topics;
            collection = decodeBase64(topics[1]);
            hexNFTNumber = base64ToHex(topics[2]);
            number = hexToDecimal(hexNFTNumber);
            currency = decodeBase64(topics[7]);
            price = microCurrencyToCurrency(hexToDecimal(base64ToHex(topics[6])));
            //console.log(`Price change - https://www.trust.market/nft/${collection}-${hexNFTNumber} - ${price} ${currency}`)
            break;
        case 'sendOffer':
            break;
        case 'withdrawOffer':
            break;
        case 'endAuction':
            console.log(JSON.stringify(tx));
            process.exit(0);
            break;
        case 'bid':
            break;
        case 'acceptOffer':
            topics = tx.logs.events[1].topics;
            collection = decodeBase64(topics[1]);
            hexNFTNumber = base64ToHex(topics[2]);
            number = hexToDecimal(hexNFTNumber);
            price = microCurrencyToCurrency(hexToDecimal(base64ToHex(topics[7])));
            currency = decodeBase64(topics[4]);
            // console.log(`Offer accepted - https://www.trust.market/nft/${collection}-${hexNFTNumber} - ${price} ${currency}`)
            process.exit(0);
            break;
        default:
            addToLogSystem(JSON.stringify(tx));
            addToLogSystem('unsupported transaction')
            break;
    }
}

export const trustMarketBot = async () => {
    const {timestamp, hash} = getLastTransactionAnalyzedTrustMarket();
    retrieveAndAnalyzeTxs({
        "getLastTransactions": getLastTxs,
        "analyzeTransaction": analyzeTrustMarketTransaction,
        "lastTransactionAnalyzed": {
            timestamp,
            hash
        },
        "setLastTransactionAnalyzed": setLastTransactionAnalyzedRandomEarth,
        "instance": "TrustMarket",
        "timeBetweenRequests": config.timeBetweenElrondAPIRequests,
        "endOfLoopTreatment": endOfLoopTreatment,
    }, 0);
}