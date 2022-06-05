import {
  initInfoDbConnection,
} from "./infoAndStatusDB/infoAndStatusDB.js";
import {trustMarketBot} from "./trustMarketBot.js";
import {deleteAllNFTCollections, initConnection, retrieveCheapestItemsIncludingAllCurrencies} from "./elrondDB.js";
import {priceRateService} from "./priceRateService.js";
import {deadRareBot} from "./deadRare.js";

const elrondBot = async () => {
  //priceRateService();
  await initInfoDbConnection();
  await initConnection();
  //await trustMarketBot();
  await deadRareBot();
  //await deleteAllNFTCollections();
  //process.exit(0);
}

elrondBot();