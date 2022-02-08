import {expect} from 'chai';
import {createRequire} from "module";
import {
    getCollectionConfigFromContract,
    getCollectionNameWithContract,
    getContractWithCollectionName
} from "../terra/terraUtils.js";
import {
    addItemsToCollection,
    closeConnection,
    deleteCollection,
    initConnection, updateItem,
    updateItems
} from "../terra/terraDB.js";
import {ANALYSIS_CODES, analyzeCollection, analyzeSales} from "../algorithm/analysisAlgorithm.js";

const require = createRequire(import.meta.url);
export const config = require("../terra/config.json")

const collectionKey = 'terraAnalysisTest';
const contract = 'terra1234567890';

describe('Analysis', () => {

    const item1 = {token_id: 1, price: 0.9, rank: 499};
    const item2 = {token_id: 2, price: 1.4, rank: 299};
    const item3 = {token_id: 3, price: 1.7, rank: 99};
    const item4 = {token_id: 4, price: 1.9, rank: 99};
    const item5 = {token_id: 5, price: 1.7, rank: 50};
    const item6 = {token_id: 6, price: 1.9, rank: 24};

    let items = [
        item1,
        item2,
        item3,
        item4,
        item5,
        item6,
    ];

    before(async () => {
        await initConnection();
        config.contracts[`${collectionKey}`] = contract;
        await addItemsToCollection(collectionKey, items);
    });

    after(async () => {
        await deleteCollection(collectionKey);
        await closeConnection();
    });

    it("should not buy since buy is set to false", async () => {
        const result = await analyzeCollection(collectionKey, {name: collectionKey, buy: false});
        expect(result[0]).to.be.equal(ANALYSIS_CODES.CONFIG_SET_TO_NOT_BUY);
    });

    it("should not buy since there aren't enough items", async () => {
        const result = await analyzeCollection(collectionKey, {name: collectionKey, triggerFactor: '5'});
        expect(result[0]).to.be.equal(ANALYSIS_CODES.NOT_ENOUGH_DATA_POINTS);
    });

    it("should not buy since there aren't enough items with a price", async () => {
        items = [];
        for (let i = 7; i <= 800; i++)
            items.push({token_id: i, rank: i});
        await addItemsToCollection(collectionKey, items);
        const result = await analyzeCollection(collectionKey, {name: collectionKey, triggerFactor: '5'});
        expect(result[0]).to.be.equal(ANALYSIS_CODES.NOT_ENOUGH_DATA_POINTS);
    });

    it("should buy since there are enough items with a price", async () => {
        items = [];
        for (let i = 801; i <= 1000; i++)
            items.push({token_id: i, price: 10, rank: i});
        await addItemsToCollection(collectionKey, items);
        const result = await analyzeCollection(collectionKey, {name: collectionKey, triggerFactor: '5'});
        expect(result[0].token_id).to.be.equal(1);
    });

    it("should not buy since the trigger factor is too low", async () => {
        const result = await analyzeCollection(collectionKey, {name: collectionKey, triggerFactor: '3'});
        expect(result[0]).to.be.equal(ANALYSIS_CODES.NOT_BUYING);
    });

    it("should not buy since the rarity factor is too low", async () => {
        await updateItem(collectionKey, {token_id: 1}, {price: 1.3});
        const result = await analyzeCollection(collectionKey, {name: collectionKey, triggerFactor: '3', rarityFactor: '1'});
        expect(result[0]).to.be.equal(ANALYSIS_CODES.NOT_BUYING);
    });

    it("should buy since a rare item is close to the floor", async () => {
        const result = await analyzeCollection(collectionKey, {name: collectionKey, triggerFactor: '3', rarityFactor: '4'});
        expect(result[0].token_id).to.be.equal(6);
    });

    /*it("should buy since a rare attribute is below the wanted price", async () => {
        const result = await analyzeCollection(collectionKey, {name: collectionKey, triggerFactor: '3', rarityFactor: '4'});
        expect(result[0].token_id).to.be.equal(6);
    });*/

});