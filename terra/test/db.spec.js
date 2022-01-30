import {expect} from 'chai';
import {
    closeConnection,
    createCollection,
    initConnection,
    deleteCollection,
    addItemToCollection,
    addItemsToCollection,
    addUniqueIndex,
    updateItemWithObjectId,
    retrieveItems,
    retrieveItemsSorted,
    addRankToItems,
    updateItems, retrieveCheapestItems
} from "../db/db.js";

describe('connection and closing function', () => {
    it('should successfully connect to mongo', async () => {
        const res = await initConnection();
        expect(res).to.be.equal(true);
    });

    it('should successfully close the connection', async () => {
        const res = await closeConnection();
        expect(res).to.be.equal(true);
    });
});

describe('collection', () => {
    const collectionKey = 'automatedTests';
    const items = [
        {key: 'test1', score: 2.2, price: 1},
        {key: 'test2', score : 1.1, price: 3},
        {key: 'test3', score : 1.05, price: 2},
        {key: 'test4', score : 8, price: 4},
        {key: 'test5', score : 4.02},
    ]

    before(async () => {
        await initConnection();
    });

    after(async () => {
        await closeConnection();
    });

    it('should create a collection', async () => {
        const res = await createCollection(collectionKey);
        expect(res).to.be.equal(true);
    });

    it('should insert an element to collection', async () => {
        const res = await addItemToCollection(collectionKey, items[0]);
        expect(res).to.be.equal(true);
    });

    it('should insert multiple elements to collection', async () => {
        const res = await addItemsToCollection(collectionKey, [
            items[1],
            items[2],
            items[3],
            items[4],
        ]);
        expect(res).to.be.equal(true);
    });

    it('should add an unique index', async () => {
        let res = await addUniqueIndex(collectionKey, {'key': 1});
        expect(res).to.be.equal(true);
        res = await addItemToCollection(collectionKey, {key: 'test1'});
        expect(res).to.be.equal(false);
    });

    it('should find with key', async () => {
        const item = (await retrieveItems(collectionKey, {key: 'test1'}, 1))[0];
        expect(item.key).to.be.equal('test1');
    });

    it('should retrieve the good number of items', async () => {
        const items = (await retrieveItems(collectionKey, {}, 3));
        expect(items.length).to.be.equal(3);
    });

    it('should retrieve the ASC sorted array', async () => {
        const items = (await retrieveItemsSorted(collectionKey, {}, 3, {score: 1}));
        expect(items[0].key).to.be.equal('test3');
    });

    it('should retrieve the DESC sorted array', async () => {
        const items = (await retrieveItemsSorted(collectionKey, {}, 5, {score: -1}));
        expect(items[0].key).to.be.equal('test4');
    });

    it('should retrieve the items that have a price in the right order', async () => {
        const items = (await retrieveCheapestItems(collectionKey));
        expect(items.length).to.be.equal(4);
        expect(items[0].key).to.be.equal('test1');
        expect(items[1].key).to.be.equal('test3');
        expect(items[2].key).to.be.equal('test2');
        expect(items[3].key).to.be.equal('test4');
    });

    it('should retrieve the list with skipped item', async () => {
        const items = (await retrieveItemsSorted(collectionKey, {}, 3, {score: 1}, 1));
        expect(items[0].key).to.be.equal('test2');
    });

    it('should update with ObjectId', async () => {
        const item = (await retrieveItems(collectionKey, {}, 1))[0];
        let res = await updateItemWithObjectId(collectionKey, item._id, {updated: true});
        expect(res).to.be.equal(true);
    });

    it('should update all items', async () => {
        let res = await updateItems(collectionKey, {}, {nf: 2});
        expect(res).to.be.equal(true);
        const items = (await retrieveItems(collectionKey, {}, 10));
        for (let i = 0; i < items.length; i++) {
            expect(items[i].nf).to.be.equal(2);
        }
    });

    it('should add rank to each item based on score', async () => {
        await addRankToItems(collectionKey, {score: 1});
        const items = (await retrieveItemsSorted(collectionKey, {}, 3, {score: 1}, 1));
        expect(items[0].rank).to.be.equal(2);
    });

    // todo: test to remove field from an item

    it('should delete a collection', async () => {
        const res = await deleteCollection(collectionKey);
        expect(res).to.be.equal(true);
    });
});