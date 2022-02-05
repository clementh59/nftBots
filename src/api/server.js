import {
    getCollectionsName,
    initConnection as initTerraConnection,
    retrieveCheapestItems as retrieveTerraCheapestItems,
    retrieveCheapestItemsUnderRank as retrieveTerraCheapestItemsUnderRank,
    retrieveNumberOfItems
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
    const _belowRank = req.query.belowRank;
    let items = [];

    let page = 1, perPage = 10, belowRank = -1;

    try {
        page = parseInt(_page);
    } catch (e) {
    }
    try {
        perPage = parseInt(_perPage);
    } catch (e) {
    }
    if (_belowRank) {
        try {
            belowRank = parseInt(_belowRank);
        } catch (e) {
        }
    }

    const contract = getContractWithCollectionName(collection);

    switch (blockchain) {
        case 'terra':
            if (belowRank === -1)
                items = await retrieveTerraCheapestItems(collection, {}, perPage, (page - 1) * perPage);
            else
                items = await retrieveTerraCheapestItemsUnderRank(collection, {}, perPage, (page - 1) * perPage, belowRank);
    }

    let numberOfItems = await retrieveNumberOfItems(collection);

    res.send({
        items: items,
        contract: contract,
        numberOfItems: numberOfItems,
    });
});

app.get('/getCollections?', async (req, res) => {
    const blockchain = req.query.bc;
    let items = [];

    switch (blockchain) {
        case 'terra':
            items = await getCollectionsName();
    }

    res.send({
        items: items,
    });
});

app.listen(port, () => {
    initTerraConnection();
    console.log(`Example app listening on port ${port}`)
})