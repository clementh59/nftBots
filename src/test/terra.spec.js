import {expect} from 'chai';
import {createRequire} from "module";
import {
    getCollectionConfigFromContract,
    getCollectionNameWithContract,
    getContractWithCollectionName
} from "../terra/terraUtils.js";
const require = createRequire(import.meta.url);
export const config = require("../terra/config.json")

describe('Terra Utils', () => {

    it('should retrieve the contract of the collection', async () => {
        const contract = getContractWithCollectionName('galactic_punks');
        expect(contract).to.be.equal('terra103z9cnqm8psy0nyxqtugg6m7xnwvlkqdzm4s4k');
    });

    it('should retrieve the name of the collection', async () => {
        const contract = getCollectionNameWithContract('terra103z9cnqm8psy0nyxqtugg6m7xnwvlkqdzm4s4k');
        expect(contract).to.be.equal('galactic_punks');
        const contract2 = getCollectionNameWithContract('terra134567890');
        expect(contract2).to.be.equal('terra134567890');
    });

    it('should retrieve the collection config from the contract address', async () => {
        const config = getCollectionConfigFromContract('terra103z9cnqm8psy0nyxqtugg6m7xnwvlkqdzm4s4k')
        expect(config.name).to.be.equal('galactic_punks');
        const config2 = getCollectionConfigFromContract('not_an_handled_address')
        expect(config2.name).to.be.equal('default');
    });
});