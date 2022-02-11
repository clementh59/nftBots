import {addUniqueIndex, closeConnection, initConnection, renameCollection, upsertItem} from "../src/terra/terraDB.js";

const collToUpdate = [
    "terra16rssne87ck6rsshg98qqj4ylfum46axp0kpazj",
];

(async () => {
    await initConnection();
    const promises = [];
    for (let i = 0; i < collToUpdate.length; i++) {
        promises.push(addUniqueIndex(collToUpdate[i], {token_id: 1}));
    }
    await Promise.all(promises);
    await closeConnection();
    process.exit(0);
})();