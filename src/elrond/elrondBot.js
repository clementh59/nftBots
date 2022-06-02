import {
  initInfoDbConnection,
} from "./infoAndStatusDB/infoAndStatusDB.js";
import {trustMarketBot} from "./trustMarketBot.js";
import {initConnection, retrieveCheapestItemsIncludingAllCurrencies} from "./elrondDB.js";
import {priceRateService} from "./priceRateService.js";

const elrondBot = async () => {
  priceRateService();
  await initInfoDbConnection();
  await initConnection();
  await trustMarketBot();
  //process.exit(0);
}

elrondBot();