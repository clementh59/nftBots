import cheerio from 'cheerio';
import got from 'got';
import {writeJSONToFile} from "../../utils.js";
import {createRequire} from "module";
const require = createRequire(import.meta.url);

const json = {items:[]};

const isNftImage = (i, link) => {
    return link.attribs.src.startsWith('https://cloudflare-ipfs.com/');
};

const isRELink = (i, link) => {
    return link.attribs.href.startsWith('https://randomearth.io/items');
};

const getLevanaDragonItem = async (number) => {

    try {

        let item = {attributes: [], history: [], order: 0};

        const response = await got('https://howrare.ai/levanadragons/' + number);
        const $ = cheerio.load(response.body);

        $('img').filter(isNftImage).each((i, link) => {
            item.image = link.attribs.src;
        });

        // get rank, score and attribute count
        $('.stat').each((i, elem) => {
            elem.children.forEach(i => {
                if (i.data?.includes('rank')) {
                    //console.log('rank: '+i.next.children[0].data);
                    item.rank = i.next.children[0].data;
                } else if (i.data?.includes('score')) {
                    //console.log('score: '+i.next.children[0].data);
                    item.rarity_score = i.next.children[0].data;
                } else if (i.data?.includes('attribute count')) {
                    //console.log('att count: '+i.next.children[0].data);
                    item.attributes_count = i.next.children[0].data;
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
        //todo: change
        item.name = `${item.attributes.find(i => i.trait_type === 'rarity').value} #${number}`

        json.items.push(item);
    } catch (e) {
        console.log(number);
    }
}

(async () => {
    let itemsAlreadyAdded = [];
    try {
        const collectionJSON = require(`./levanaDragons.json`);
        itemsAlreadyAdded = collectionJSON.items;
    } catch (e) {
        console.log(e)
    }
    json.items.push(...itemsAlreadyAdded);
    for (let j = 1; j <= 8887; j+=200) {
        let promises = [];
        for (let i = j; i <= j+199; i++) {
            if (!json.items.find(s => s.name.endsWith(`#${i}`)))
                promises.push(getLevanaDragonItem(i));
        }
        // json.items.forEach((i) => i.rank = parseInt(i.rank));
        await Promise.all(promises);
        writeJSONToFile('levanaDragons.json', json);
        console.log("new milestone: "+(j+199));
    }
    console.log('numberOfItems: ' + json.items.length);
    writeJSONToFile('levanaDragons.json', json);
})();
