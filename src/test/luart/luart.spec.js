import {createRequire} from "module";
import {closeConnection, deleteCollection, initConnection, retrieveItems} from "../../terra/terraDB.js";
import {expect} from "chai";
import {analyzeLuartTransaction} from "../../terra/luart/luart.js";

const require = createRequire(import.meta.url);
export const data = require("./data.json");

describe('Transaction analysis - Luart', () => {

    before(async () => {
        await initConnection();
    });

    after(async () => {
        await closeConnection();
    });

    it("should correctly analyze a post order", async () => {
        await analyzeLuartTransaction(data.post_sell_order);
        let res = (await retrieveItems('terra12uxqcqfqrr9hrzen6pz0fx565hr8u88qfyusc0', {}))[0];
        expect(res.token_id).to.be.equal('953');
        expect(res.marketplace).to.be.equal('luart');
        expect(res.owner).to.be.equal('terra1n4rhqw5yw535xnm4se9afrrllv83nud9ze2x4x');
        expect(res.price).to.be.equal(0.6);
        expect(res.order_id).to.be.equal('sell_1647314957268_0.27758214607041753');
        expect(res.status.expiration).to.be.equal(4800914957);
    });

    it("Luart db should now have an entry", async () => {
        let res = (await retrieveItems('luart', {}))[0];
        expect(res.token_id).to.be.equal('953');
        expect(res.contractAddress).to.be.equal('terra12uxqcqfqrr9hrzen6pz0fx565hr8u88qfyusc0');
        expect(res.order_id).to.be.equal('sell_1647314957268_0.27758214607041753');
    });

    it("should correctly analyze a buy order", async () => {
        await analyzeLuartTransaction(data.buy_an_item);
        let res = (await retrieveItems('terra12uxqcqfqrr9hrzen6pz0fx565hr8u88qfyusc0', {}))[0];
        expect(res.token_id).to.be.equal('953');
        expect(res.marketplace).to.be.equal(undefined);
        expect(res.owner).to.be.equal('terra16vmqv8jyux606ulgq2h8t2vyd0k8aqh5cgeple');
        expect(res.price).to.be.equal(undefined);

        // it should be in the history of the item
        expect(res.history[0]).to.be.deep.equal({
            marketplace: 'luart',
            price: 0.6,
            owner: 'terra1n4rhqw5yw535xnm4se9afrrllv83nud9ze2x4x',
            isBid: false,
            tx: '4F07F726537244F87AD7A350576386DFC0244AF47A32E31EF65EDFA52FF82C4B',
            date: '2022-03-15T07:58:14Z',
        });
    });

    it("Luart db should now be empty", async () => {
        let res = (await retrieveItems('luart', {}));
        expect(res[0]).to.be.equal(undefined);
    });

    it("Should correctly cancel an order", async () => {
        await analyzeLuartTransaction(data.cancel_order.post);
        let res = (await retrieveItems('terra1x8m8vju636xh7026dehq6g7ye66tn0yu4c7mq8', {}))[0];
        expect(res.token_id).to.be.equal('1274');
        expect(res.marketplace).to.be.equal('luart');
        expect(res.owner).to.be.equal('terra18r4k52m85zfw6hq2k9292aruzctwrn2h7puzxe');
        expect(res.price).to.be.equal(12);
        expect(res.order_id).to.be.equal('sell_1647242220781_0.2778411728381782');
        expect(res.status.expiration).to.be.equal(4800842221);
        await analyzeLuartTransaction(data.cancel_order.cancel);
        res = (await retrieveItems('terra1x8m8vju636xh7026dehq6g7ye66tn0yu4c7mq8', {}))[0];
        expect(res.token_id).to.be.equal('1274');
        expect(res.marketplace).to.be.equal(undefined);
        expect(res.order_id).to.be.equal(undefined);
        expect(res.price).to.be.equal(undefined);
    });

});