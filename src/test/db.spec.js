import {expect} from 'chai';
import {
    _closeConnection_,
    _createCollection_,
    _initConnection_,
    _deleteCollection_,
    _addItemToCollection_,
    _addItemsToCollection_,
    _addUniqueIndex_,
    _updateItemWithObjectId_,
    _retrieveItems_,
    _retrieveItemsSorted_,
    _addRankToItems_,
    _updateItems_,
    _retrieveCheapestItems_,
    _updateItem_, _upsertItem_, _renameCollection_, _getCollectionsName_, _addHistoryEntryToItem_
} from "../db/db.js";
import {createRequire} from "module";

const require = createRequire(import.meta.url);
export const config = require("../terra/config.json")

const uri = config.mongo.uri;
const dbName = 'mocha';

describe('connection and closing function', () => {

    let client;

    it('should successfully connect to mongo', async () => {
        client = await _initConnection_(client, uri);
        expect(client).not.to.be.equal(null);
    });

    it('should successfully close the connection', async () => {
        const res = await _closeConnection_(client);
        expect(res).to.be.equal(true);
    });
});

describe('collection', () => {
    const collectionKey = 'automatedTests';
    const newCollectionKey = 'automatedTestsRenamed';
    const items = [
        {key: 'test1', score: 2.2, price: 1},
        {key: 'test2', score: 1.1, price: 3},
        {key: 'test3', score: 1.05, price: 2},
        {key: 'test4', score: 8, price: 4},
        {key: 'test5', score: 4.02},
    ]
    let client;

    before(async () => {
        client = await _initConnection_(client, uri);
    });

    after(async () => {
        await _closeConnection_(client);
    });

    it('should create a collection', async () => {
        const res = await _createCollection_(client, dbName, collectionKey);
        expect(res).to.be.equal(true);
    });

    it('should insert an element to collection', async () => {
        const res = await _addItemToCollection_(client, dbName, collectionKey, items[0]);
        expect(res).to.be.equal(true);
    });

    it('should insert multiple elements to collection', async () => {
        const res = await _addItemsToCollection_(client, dbName, collectionKey, [
            items[1],
            items[2],
            items[3],
            items[4],
        ]);
        expect(res).to.be.equal(true);
    });

    it('should add an unique index', async () => {
        let res = await _addUniqueIndex_(client, dbName, collectionKey, {'key': 1});
        expect(res).to.be.equal(true);
        res = await _addItemToCollection_(client, dbName, collectionKey, {key: 'test1'});
        expect(res).to.be.equal(false);
    });

    it('should find with key', async () => {
        const item = (await _retrieveItems_(client, dbName, collectionKey, {key: 'test1'}, 1))[0];
        expect(item.key).to.be.equal('test1');
    });

    it('should retrieve the good number of items', async () => {
        const items = (await _retrieveItems_(client, dbName, collectionKey, {}, 3));
        expect(items.length).to.be.equal(3);
    });

    it('should retrieve the ASC sorted array', async () => {
        const items = (await _retrieveItemsSorted_(client, dbName, collectionKey, {}, 3, {score: 1}));
        expect(items[0].key).to.be.equal('test3');
    });

    it('should retrieve the DESC sorted array', async () => {
        const items = (await _retrieveItemsSorted_(client, dbName, collectionKey, {}, 5, {score: -1}));
        expect(items[0].key).to.be.equal('test4');
    });

    it('should retrieve the items that have a price in the right order', async () => {
        const items = (await _retrieveCheapestItems_(client, dbName, collectionKey));
        expect(items.length).to.be.equal(4);
        expect(items[0].key).to.be.equal('test1');
        expect(items[1].key).to.be.equal('test3');
        expect(items[2].key).to.be.equal('test2');
        expect(items[3].key).to.be.equal('test4');
    });

    it('should retrieve the list with skipped item', async () => {
        const items = (await _retrieveItemsSorted_(client, dbName, collectionKey, {}, 3, {score: 1}, 1));
        expect(items[0].key).to.be.equal('test2');
    });

    it('should update with ObjectId', async () => {
        const item = (await _retrieveItems_(client, dbName, collectionKey, {}, 1))[0];
        let res = await _updateItemWithObjectId_(client, dbName, collectionKey, item._id, {updated: true});
        expect(res).to.be.equal(true);
    });

    it('should update all items', async () => {
        let res = await _updateItems_(client, dbName, collectionKey, {}, {nf: 2});
        expect(res).to.be.equal(true);
        const items = (await _retrieveItems_(client, dbName, collectionKey, {}, 10));
        for (let i = 0; i < items.length; i++) {
            expect(items[i].nf).to.be.equal(2);
        }
    });

    it('should add rank to each item based on score', async () => {
        await _addRankToItems_(client, dbName, collectionKey, {score: 1});
        const items = (await _retrieveItemsSorted_(client, dbName, collectionKey, {}, 3, {score: 1}, 1));
        expect(items[0].rank).to.be.equal(2);
    });

    it('should remove an attribute of a given item', async () => {
        let item = (await _retrieveItems_(client, dbName, collectionKey, {key: 'test4'}))[0];
        expect(item.price).to.be.equal(4);
        await _updateItem_(client, dbName, collectionKey, {key: 'test4'}, {}, {"price": ""});
        item = (await _retrieveItems_(client, dbName, collectionKey, {key: 'test4'}))[0];
        expect(item.price).to.be.equal(undefined);
    });

    it('should insert an item using upsert', async () => {
        const res = await _upsertItem_(client, dbName, collectionKey, {key: 'test1010'}, {
            'key': 'test1010',
            'testKey': 'testKey',
            'name': 'test',
        });
        expect(res).to.be.equal(true);
        const item = (await _retrieveItems_(client, dbName, collectionKey, {key: 'test1010'}, 1))[0];
        expect(item.name).to.be.equal('test');
    });

    it('should update an item using upsert', async () => {
        const res = await _upsertItem_(client, dbName, collectionKey, {key: 'test1010'}, {
            'key': 'test1010',
        }, {'name': ''});
        expect(res).to.be.equal(true);
        const item = (await _retrieveItems_(client, dbName, collectionKey, {key: 'test1010'}, 1))[0];
        expect(item.name).to.be.equal(undefined);
        expect(item.testKey).to.be.equal('testKey');
    });

    it('should add an item history', async () => {
        let res = await _addHistoryEntryToItem_(client, dbName, collectionKey, {key: 'test1010'}, {
            price: 2,
            seller: 'terraABC',
            buyer: 'terraDEF',
            date: '2022-03-08T21:43:37Z',
        });
        expect(res).to.be.equal(true);
        let item = (await _retrieveItems_(client, dbName, collectionKey, {key: 'test1010'}, 1))[0];
        expect(item.history.length).to.be.equal(1);
        expect(item.history).to.deep.equal([
            {
                price: 2,
                seller: 'terraABC',
                buyer: 'terraDEF',
                date: '2022-03-08T21:43:37Z',
            }
        ]);
        await _addHistoryEntryToItem_(client, dbName, collectionKey, {key: 'test1010'}, {
            price: 3,
            seller: 'terraABC',
            buyer: 'terraDEF',
            date: '2022-03-10T21:43:37Z',
        });
        item = (await _retrieveItems_(client, dbName, collectionKey, {key: 'test1010'}, 1))[0];
        expect(item.history.length).to.be.equal(2);
    });

    it('should rename a collection', async () => {
        const res = await _renameCollection_(client, dbName, collectionKey, newCollectionKey);
        expect(res).to.be.equal(true);
        const item = (await _retrieveItems_(client, dbName, newCollectionKey, {key: 'test1010'}, 1))[0];
        expect(item.testKey).to.be.equal('testKey');
    });

    it('should retrieve the collections name', async () => {
        const res = await _getCollectionsName_(client, dbName);
        console.log(res.includes(newCollectionKey));
    });

    it('should delete a collection', async () => {
        const res = await _deleteCollection_(client, dbName, newCollectionKey);
        expect(res).to.be.equal(true);
    });
});