import {
  initInfoDbConnection,
} from "./db/infoAndStatusDB.js";
import {trustMarketBot} from "./marketplaces/trustMarketBot.js";
import {deleteAllNFTCollections, initConnection, retrieveCheapestItemsIncludingAllCurrencies} from "./db/elrondDB.js";
import {priceRateService} from "./services/priceRateService.js";
import {deadRareBot} from "./marketplaces/deadRare.js";
import {areAllMarketplacesUpToDate} from "./services/coordinator.js";

const elrondBot = async () => {
  //priceRateService();
  await initInfoDbConnection();
  await initConnection();
  await trustMarketBot();
  await deadRareBot();
  //await deleteAllNFTCollections();
  //process.exit(0);
}

elrondBot();