import {randomEarthBot} from "./randomEarth/randomEarthBot.js";
import {closeConnection, initConnection, renameCollection, retrieveCheapestItems} from "./terraDB.js";
import {closeInfoDbConnection, initInfoDbConnection} from "./infoAndStatusDB/infoAndStatusDB.js";
import {addToLogSystem} from "../logSystem.js";

const main = async () => {
    await initConnection();
    await initInfoDbConnection();
    //const res = await retrieveCheapestItems('terra103z9cnqm8psy0nyxqtugg6m7xnwvlkqdzm4s4k', {}, 10)
    //res.forEach((e) => console.log(`${e.price} - ${e.name} - ${e.rank}`))
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