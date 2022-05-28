import {
  initInfoDbConnection,
} from "./infoAndStatusDB/infoAndStatusDB.js";
import {trustMarketBot} from "./trustMarketBot.js";

const elrondBot = async () => {
  await initInfoDbConnection();
  await trustMarketBot();
}

elrondBot();