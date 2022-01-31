import {randomEarthBot} from "./randomEarthBot.js";
import {closeConnection, initConnection, retrieveCheapestItems} from "./terraDB.js";
import {closeInfoDbConnection, initInfoDbConnection} from "./infoAndStatusDB/infoAndStatusDB.js";

const main = async () => {
    await initConnection();
    await initInfoDbConnection();
    //const res = await retrieveCheapestItems('terra103z9cnqm8psy0nyxqtugg6m7xnwvlkqdzm4s4k', {}, 10)
    randomEarthBot();
    //luartBot();
    //knowhereBot();
    //res.forEach((e) => console.log(`${e.price} - ${e.name} - ${e.rank}`))
}

process.on('SIGINT', async () => {
    console.log('Stopping the application properly');
    await closeConnection();
    await closeInfoDbConnection();
    process.exit(0);
});

main()