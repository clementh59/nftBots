import {
    getCollectionsName as getTerraCollectionsName,
    initConnection as initTerraConnection,
    retrieveCheapestItems as retrieveTerraCheapestItems,
    retrieveCheapestItemsUnderRank as retrieveTerraCheapestItemsUnderRank,
    retrieveNumberOfItems as retrieveTerraNumberOfItems
} from "../terra/terraDB.js";

import {
    initConnection as initElrondConnection,
    getCollectionsName as getElrondCollectionsName,
    retrieveNumberOfItems as retrieveElrondNumberOfItems,
    retrieveCheapestItems as retrieveElrondCheapestItems,
    retrieveCheapestItemsUnderRank as retrieveElrondCheapestItemsUnderRank, retrieveCheapestItemsIncludingAllCurrencies,
} from "../elrond/elrondDB.js";

import express from 'express';
import cors from 'cors';
import {getCollectionNameWithContract, getContractWithCollectionName} from "../terra/terraUtils.js";
import {buildUrlFromDbItem} from "../elrond/elrondUtils.js";
import {loadLKMexPrice, rates} from "../elrond/priceRateService.js";

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

    let contract;
    let numberOfItems;

    switch (blockchain) {
        case 'terra':
            contract = getContractWithCollectionName(collection);
            if (belowRank === -1)
                items = await retrieveTerraCheapestItems(collection, {}, perPage, (page - 1) * perPage);
            else
                items = await retrieveTerraCheapestItemsUnderRank(collection, {}, perPage, (page - 1) * perPage, belowRank);
            numberOfItems = await retrieveTerraNumberOfItems(collection);
            break;
        case 'elrond':
            if (belowRank === -1)
                items = await retrieveCheapestItemsIncludingAllCurrencies(collection,  perPage, (page - 1) * perPage);
            else
                items = await retrieveCheapestItemsIncludingAllCurrencies(collection, perPage, (page - 1) * perPage, belowRank);
            numberOfItems = await retrieveElrondNumberOfItems(collection);
            items = items.map(i => ({...i, url: buildUrlFromDbItem(i, collection)}))
            break;
    }

    res.send({
        items: items,
        contract: contract,
        numberOfItems: numberOfItems,
        rates: rates,
    });
});

app.get('/getCollections?', async (req, res) => {
    const blockchain = req.query.bc;
    let items = [];

    switch (blockchain) {
        case 'terra':
            items = await getTerraCollectionsName();
            break;
        case 'elrond':
            items = await getElrondCollectionsName();
            break;
    }

    res.send({
        items: items,
    });
});

app.listen(port, () => {
    initTerraConnection();
    initElrondConnection();
    // todo: load rates
    rates.EGLD = 78.37;
    rates.MEX = 0.00009152;
    loadLKMexPrice();
    console.log(`Example app listening on port ${port}`)
})