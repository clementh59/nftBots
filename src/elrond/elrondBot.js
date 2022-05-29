import {
  initInfoDbConnection,
} from "./infoAndStatusDB/infoAndStatusDB.js";
import {trustMarketBot} from "./trustMarketBot.js";
import {initConnection} from "./elrondDB.js";

const elrondBot = async () => {
  await initInfoDbConnection();
  await initConnection();
  await trustMarketBot();
}

elrondBot();