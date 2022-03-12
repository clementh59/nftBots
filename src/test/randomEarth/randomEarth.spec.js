import {expect} from 'chai';
import {createRequire} from "module";
import {analyzeRandomEarthTransaction} from "../../terra/randomEarth/randomEarthBot.js";
import {closeConnection, deleteCollection, initConnection, retrieveItems} from "../../terra/terraDB.js";

const require = createRequire(import.meta.url);
export const data = require("./data.json");

describe('Transaction analysis', () => {

    before(async () => {
        await initConnection();
    });

    after(async () => {
        await deleteCollection('terrapins');
        await deleteCollection('galactic_punks');
        await closeConnection();
    });

    it("should correctly analyze an accepted bid - accept bid", async () => {
        await analyzeRandomEarthTransaction(data.accept_bid_example.post_order);
        let res = await retrieveItems('terrapins', {});
        expect(res[0].token_id).to.be.equal('11123232000834668693287278118950759417');
        expect(res[0].marketplace).to.be.equal('randomEarth');
        expect(res[0].owner).to.be.equal('terra1y2svean3gutr6pfmf9qh2l25ltplpzqjk6smse');
        expect(res[0].price).to.be.equal(20);

        await analyzeRandomEarthTransaction(data.accept_bid_example.post_bid);
        await analyzeRandomEarthTransaction(data.accept_bid_example.accept_bid);
        res = await retrieveItems('terrapins', {});
        expect(res[0].price).to.be.equal(undefined);
        expect(res[0].history).to.deep.equal([
            {
                isBid: true,
                price: 9,
                date: '2022-03-12T11:39:22Z',
                tx: "FF23B36B1663B0B800FC8C83D8001B136B46D69776C1BD9B7543D2BB82C0E877"
            }
        ]);
    });

    it("shouldn't add to history again", async () => {
        await analyzeRandomEarthTransaction(data.accept_bid_example.post_order);
        await analyzeRandomEarthTransaction(data.accept_bid_example.post_bid);
        await analyzeRandomEarthTransaction(data.accept_bid_example.accept_bid);
        let res = await retrieveItems('terrapins', {});
        expect(res[0].history).to.deep.equal([
            {
                isBid: true,
                price: 9,
                date: '2022-03-12T11:39:22Z',
                tx: "FF23B36B1663B0B800FC8C83D8001B136B46D69776C1BD9B7543D2BB82C0E877"
            }
        ]);
    });

    it("should correctly analyze a normal sale", async () => {
        await analyzeRandomEarthTransaction(data.normal_sale_example.post_order);
        let res = await retrieveItems('galactic_punks', {});
        expect(res[0].token_id).to.be.equal('63937212142746724071303718855969496078');
        expect(res[0].marketplace).to.be.equal('randomEarth');
        expect(res[0].owner).to.be.equal('terra12ma5wy7hm4lgc9ul7syhyvq42tthua7selr9wz');
        expect(res[0].price).to.be.equal(33);
        await analyzeRandomEarthTransaction(data.normal_sale_example.execute_order);
        res = await retrieveItems('galactic_punks', {});
        expect(res[0].history).to.deep.equal([
            {
                isBid: false,
                price: 33,
                date: '2022-03-12T16:19:54Z',
                tx: "E567B7A86CF3F8B087C8A8EF4B06E0CF57E776A696DC6E5C6956CD27BA133E55"
            }
        ]);
    });

    it("shouldn't add to history again - normal sale", async () => {
        await analyzeRandomEarthTransaction(data.normal_sale_example.post_order);
        await analyzeRandomEarthTransaction(data.normal_sale_example.execute_order);
        let res = await retrieveItems('galactic_punks', {});
        expect(res[0].history).to.deep.equal([
            {
                isBid: false,
                price: 33,
                date: '2022-03-12T16:19:54Z',
                tx: "E567B7A86CF3F8B087C8A8EF4B06E0CF57E776A696DC6E5C6956CD27BA133E55"
            }
        ]);
    });

});