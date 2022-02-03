import {
    initConnection as initTerraConnection,
    retrieveCheapestItems as retrieveTerraCheapestItems
} from "../terra/terraDB.js";

import express from 'express';
import cors from 'cors';
import {getCollectionNameWithContract, getContractWithCollectionName} from "../terra/terraUtils.js";
const app = express()
const port = 2727;

app.use(cors());

app.get('/ping', (req, res) => {
    res.send('pong')
});

app.get('/getCheapestItems?', async (req, res) => {
    const blockchain = req.query.bc;
    const collection = req.query.collection;
    const _perPage = req.query.perPage;
    const _page = req.query.page;
    let items = [];

    let page = 1, perPage = 10;

    try {
        page = parseInt(_page);
    } catch (e) {}
    try {
        perPage = parseInt(_perPage);
    } catch (e) {}

    const contract = getContractWithCollectionName(collection);

    switch (blockchain) {
        case 'terra':
            items = await retrieveTerraCheapestItems(collection, {}, perPage, (page - 1) * perPage);
    }

    res.send({
        items: items,
        contract: contract,
    });
});

app.listen(port, () => {
    initTerraConnection();
    console.log(`Example app listening on port ${port}`)
})