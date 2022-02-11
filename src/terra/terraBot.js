import {randomEarthBot} from "./randomEarth/randomEarthBot.js";
import {closeConnection, initConnection} from "./terraDB.js";
import {closeInfoDbConnection, initInfoDbConnection} from "./infoAndStatusDB/infoAndStatusDB.js";
import {addToLogSystem} from "../logSystem.js";

const main = async () => {
    await initConnection();
    await initInfoDbConnection();
    addToLogSystem("Launching the bot at " + Date.now());
    randomEarthBot();
    //luartBot();
    //knowhereBot();
}

process.on('SIGINT', async () => {
    console.log('\nStopping the application properly');
    await addToLogSystem("Stapping the bot at " + Date.now());
    await closeConnection();
    await closeInfoDbConnection();
    process.exit(0);
});

main()