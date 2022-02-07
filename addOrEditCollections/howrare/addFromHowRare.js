import cheerio from 'cheerio';
import got from 'got';
import {writeJSONToFile} from "../../src/utils.js";
import {createRequire} from "module";

const require = createRequire(import.meta.url);
const json = {items: []};

const collectionName = 'styllar';
const collectionNameInHowRareUrl = 'styllar';
const number = 10050;

const isNftImage = (i, link) => {
    return link.attribs.src.startsWith('https://cloudflare-ipfs.com/')
        || link.attribs.src.startsWith('https://d75aawrtvbfp1.cloudfront.net/')
        //|| link.attribs.src.startsWith('https://dy7lm72krmydr.cloudfront.net/');
};

const isRELink = (i, link) => {
    return link.attribs.href.startsWith('https://randomearth.io/items');
};

const getItem = async (number) => {

    try {

        let item = {attributes: [], history: [], order: 0};

        const response = await got(`https://howrare.ai/${collectionNameInHowRareUrl}/${number}`);
        const $ = cheerio.load(response.body);

        $('img').filter(isNftImage).each((i, link) => {
            item.image = link.attribs.src;
        });

        // get rank, score and attribute count
        $('.stat').each((i, elem) => {
            elem.children.forEach(i => {
                if (i.data?.includes('rank')) {
                    //console.log('rank: '+i.next.children[0].data);
                    item.rank = parseInt(i.next.children[0].data);
                } else if (i.data?.includes('score')) {
                    //console.log('score: '+i.next.children[0].data);
                    item.rarity_score = parseFloat(i.next.children[0].data);
                } else if (i.data?.includes('attribute count')) {
                    //console.log('att count: '+i.next.children[0].data);
                    item.attributes_count = parseInt(i.next.children[0].data);
                }
            })
        });

        // get attributes
        $('.attribute').each((i, elem) => {
            let att = elem.children[0].data;
            while (att.includes('\n'))
                att = att.replace('\n', '');
            while (att.includes('\t'))
                att = att.replace('\t', '');
            while (att.startsWith(' '))
                att = att.substring(1, att.length);
            while (att.endsWith(' '))
                att = att.substring(0, att.length - 1);
            const value = elem.children[1].children[0].data;
            item.attributes.push({trait_type: att, value: value});
        });

        $('a').filter(isRELink).each((i, elem) => {
            item.token_id = elem.attribs.href.substring(elem.attribs.href.lastIndexOf('_') + 1, elem.attribs.href.length);
        });

        // item.name
        $('.overflow').each((i, elem) => {
            item.name = elem.children[1].children[0].data;
        });

        json.items.push(item);
        return item;
    } catch (e) {
        console.log(e)
        console.log(number);
    }
}

let step = 20;

(async () => {
    let itemsAlreadyAdded = [];
    try {
        const collectionJSON = require(`./${collectionName}.json`);
        itemsAlreadyAdded = collectionJSON.items;
    } catch (e) {}
    json.items.push(...itemsAlreadyAdded);
    /*for (let j = 1; j <= number; j+=step) {
        let promises = [];
        for (let i = j; i < j+step; i++) {
            if (!json.items.find(s => s.name.endsWith(`#${i}`)))
                promises.push(getItem(i));
        }
        await Promise.all(promises);
        writeJSONToFile(collectionName+'.json', json);
        console.log("new milestone: "+(j+199));
    }*/
    for (let i = 0; i <= number; i++) {
        if (!json.items.find(s => s.name.endsWith(`#${i}`))) {
            await getItem(i);
            writeJSONToFile(collectionName + '.json', json);
            console.log(i);
        }
    }
    console.log('numberOfItems: ' + json.items.length);
    writeJSONToFile(collectionName+'.json', json);
})();