import {createRequire} from "module";
import {getLastTransactions} from "./elrondUtils.js";
import {getLastTransactionIdAnalyzedTrustMarket, initInfoDbConnection} from "./infoAndStatusDB/infoAndStatusDB.js";
const require = createRequire(import.meta.url);
const config = require("./config.json")

const analyzeTx = (tx) => {
  console.log(tx);
}

/**
 *
 * @param {number} offset - the number of txs to skip
 * @param {number} size - the number of txs to retrieve
 * @returns {Promise<unknown>} the list of txs
 */
const retrieveTxs = async (offset, size) => {
  return getLastTransactions(config.contracts.trustMarket, offset, size);
}

const retrieveLoop = async () => {
  let txs = [];
  for (let i = 10; i < 30; i++) {
    txs = await retrieveTxs(i * 50, 50);
    txs.forEach(async tx => await analyzeTx(tx));
  }
}

const sandbox = async () => {
  await initInfoDbConnection();
  await getLastTransactionIdAnalyzedTrustMarket();
}

sandbox();