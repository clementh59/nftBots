import {randomEarthBot} from "./randomEarthBot.js";
import {closeConnection, initConnection} from "./db/db.js";
import {timer} from "../utils.js";

const main = async () => {
    await initConnection();
    randomEarthBot();
    //luartBot();
    //knowhereBot();
}

process.on('SIGINT', async () => {
    console.log('Stopping the application properly');
    await timer(1000);
    await closeConnection();
    process.exit(0);
});

main()