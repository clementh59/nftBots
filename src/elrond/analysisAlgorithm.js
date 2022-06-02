import {rates} from "./priceRateService.js";
import {addToLogErrorSystem, addToLogSystem} from "../logSystem.js";
import {initConnection, retrieveCheapestItems, retrieveCheapestItemsIncludingAllCurrencies} from "./elrondDB.js";
import {buildTrustMarketUrlFromDbItem} from "./elrondUtils.js";
import {buy} from "./actions/autoBuy.js";

/**
 * Analyze all DB to check if smthg is interesting
 * @param {[string]} collections - the contract addresses of collections - NOT NAMES
 */
export const analyzeSales = async (collections) => {

    if (
        rates.EGLD === -1
        || rates.RIDE === -1
        || !rates.EGLD
        || !rates.RIDE
    ) {
        console.log('The price rates are not loaded!!');
        return;
    }

    const promises = [];
    collections = [...new Set(collections)];
    for (let i = 0; i < collections.length; i++) {
        promises.push(analyzeCollection(collections[i]));
    }
    await Promise.all(promises);
}

const analyzeCollection = async (collectionName) => {

    const cheapestItems = await retrieveCheapestItemsIncludingAllCurrencies(collectionName, 50);

    if (cheapestItems.length < 50)
        return;

    const triggerFactor = 0.92;
    const minBenefInEGLD = 0.15;

    // step 1 - check if a very cheap item has been listed
    if (cheapestItems[0].priceInEGLD <= cheapestItems[1].priceInEGLD * triggerFactor && (cheapestItems[1].priceInEGLD - cheapestItems[0].priceInEGLD) > minBenefInEGLD) {
        await buy(cheapestItems[0], collectionName, `Buying ${cheapestItems[0].name ? cheapestItems[0].name : collectionName} at ${cheapestItems[0].priceInEGLD} because floor is ${cheapestItems[1].priceInEGLD}`);
    } else {
        addToLogSystem(`${collectionName} - No (1) - ${cheapestItems[0].priceInEGLD} > ${cheapestItems[1].priceInEGLD * triggerFactor}`);
    }
}

//analyzeSales(["MICE-a0c447","EAPES-8f3c1f","LSK-e45035","VOICE-7c1479","HOMODEUS-8811ab","ECATS-2c3d99","LUPUL-367038","BULL-0d45dc","EFRIENDS-3b9fec","LIONS-d7a901","TILE-9d6c87","ROCKET-2e6fba","W3P-48cc5a","MOS-b9b4b2","W3C-bcc335","DEAD-79f8d1","EGIRL-443b95","GNOGONS-73222b","BEARS-367fe1","BANANA-e955fd","PIGLETHH-7357ca","MONKEY-ac9bdf","LIONESS-dd909d","DRUDO-94bd36","ASTRONAUTS-22c98a","SAC-c60db0","LIGHTNINGB-496265","EPUNKS-46b186","VALIDATORS-e7e287","EGOLDENBOY-2b0ca1","QUACK-f01e02","GUARDIAN-3d6635","CLC-92265b","REALM-579543","XPLANTCREW-3d80a9","LYNXEE-212309","CGPASS-73ac68","RAPTOR-28e21c","TAKANNE-3db244","HYPM-c893ef","WARRIORZ-2f0986","ROKFACTION-4a5232","OVERTURE-276027","AERMES-ac9886","PITTZ-1a4c2d","CPMC-df60b6","KROGAN-54c361","SHIBACLUB-7a8523","WHALEYS-24a32a","MAIA-d1482d","HELIOS2022-1ea0f2","EVZ-7e2105","PNTNGS2-7c01d5","DOMNITORI-8878f5","MADZALP-c9275e","LBEAR-29987e","PATRON-e12b57","MAKA-1a133d","RBNANG-bd0b57","NBERGS-139351","DRIFTERS-efd96c","SRC-27d8ff","EGLDHUNTER-9abc5c","APC-928458","EMINERS-5b421f","GIFT-787c7d","PROFILEXG-af7e65","GIRLS-7a61b1","OGS-3f1408","RUDIES-d19c04","BEAR-97a7b6","ARMOURY-34d6f1","DEAINOSTRI-a141fb","BLK-56d838","FIRESOUL-7719e9","PARTY-705dcb","ETVS-738899","LIFESOUL-fbbc7b","APES-593536","WATERSOUL-2d8eeb","TIKY-84fe8b","ZODIAC-d0eb2a","PRICK-f2c847","PROTECTORS-1bae37","NBC-a454c2","SRB-61daf7","BABYWHALEY-132bac","CYBERS-008603","BISON-4df897","ESAM-ab9c94","MAYA-4d248d","MRBP-5b28bd","POLITIKOS-b7ea0a","SANTARUDIE-929bda","PLATAXMAS-874bd3","DBZE-0848cc","RADCCCTEAM-be19dc","ANDMCCTEAM-be19dc","LAFC-89473b","GIANTS-93cadd","STANDARD-84de00","BUNNY-dc77f3","CRDCNFT-86d799","SKLERD-7b0cab","PEACEARMY-964837","MINOTAUR-ee193a","BDGA-a05446","GNOGEN-8156fb","ERTHREE-f8aaf8","TRIFY-f446b8","SKIPPYY-8e8a46","NAMEBOT-cc62ea","LTFSPACE-8b7588","KCHESS-d58369","HMORGOTH-ecd5fb","HEART-11db1d","GOLD-6d9d0f","GLDMEX-3cf8a6","CITY-f54b51","CIRCUS-fe2ad9","BUD-3ee0cf","BROTACI-2855a2","ORC-ef544d","EKS13-ed5a08","CBH-99b9ce","TOUC-f58bae","BEAR-e560c4","BADGE-8f04cc","EHEADZ-c96085","SEEDTICKET-8967f8","CAPTAIN-86caad","BRC-701822","DOODLES-21fae7","EAGLE-525205","MISS-2dba53","LORDOFF-2e4e60","SEEDS-153f7a","EGLDPUNKS-d18f02","JOKER-753c62","WIZEWOLF-054ccd","SHARKS-be576b","POL-1e9209","CORRUPT-f1b667","SCB-534bb5","MPIXPEOPLE-c8fb4f","DRAGON-ddf65a","UNDEADS-32068b","LIZARD-0e0423","ECAKED-807cc1","DUMB-5ec1f3","ADASTRA-9b336e","OCTSQD-b9a68f","BASMRO-6dbdd0","CRYPTO-3d7034","PLTSTART-f3ac90","NEONCYBERS-1442a8","EGLDHUNTER-8d39f4","SYMB-a060b0","VIK-582ac8","EGLDOGGO-5fe6cd","UKR-2e55cf","JOKER-b32441","FLUFF-288a44","EGAL-e0a14f","CATSMAFIA-074761","EGG-6ee076","EAPE-a44144","WOLF-300a63","ECYBER-684a65","KPOKER-c95e35","COWS-519b6e","ELON-f767a0","EPUNKS-44c368","XXXGIRL-ad1559","XVALENTINA-62fc1e","SHROOMGIRL-6146d8","LIMITXGIRL-75e59d","CFSMEME-189581","EARTHSOUL-7719e9","FITY1-5cbf80","ELF-065a2e","ENFT-d40748","GRDF-caf839","RATZ-9fc736","LDB-ada909","KNIGHTS-e4a1fd","PIZZA-5e0a0e","TRIBUTE-a5ba15","HSWOLF-76e8bf","HERO-6271d1","VIP-6b45f0","RACE-c06f4e","ANIME-56e8c0","MAW-894a92","TPCM-396506","PHPX-4f58e9","TOTHEMOON-8c59a8","MANY-39af2c","MRG-1c3ba4","VROM-b2fe83","ELDS-02381b","DRKLS-b569ac","EDEN-1e4ea5","EVFR-35e9c3","SUPERVIC-f07785","NDO-950433","CIOBANITA-25ffdc","KILLERS-a268fe","ELRHINO-e44400","INVISIBLE-fce257","EDICKS-df4d55","EXPLORER-928ad3","TFMAPHNX-9133de","OFFICE-a74b34","BUSINESS-3662bd","SHIB-50039b","BM100-484db2","XMAS3-c08bc0","OMNISCIENT-61f4a0","DRG-875e1a","ESPRAYS-253b3c","PASS-3df7bf","ULTRAS-3875ff","MIKI-bd4856","DEADBROS-bf822f","EWIZZ-1e8ddb","LGFP-20b670","OGV-eca1e9","BANANA-26afa2","OLIVEIRA-bcfb8e","MMONKEY-20250e","DOFA-4b490a","UNIQ-8d180b","SSR-4e417b","SHARK-8c1c46","EFRIENDS-90c006","TICKET-af5815","TFMAGNOGON-470521","LIMITED-52b1fe","PGLD-896ac3","PANDA2-a6a792","CIOBAN-75d81e","SOS01HOUND-252d15","EPRES-47c1ff","TRO-652d6d","TZEP-32f419","NFTUDURI-2990b6","EROM-727d25","ELEPHANTS-06fc6f","ZOMBIE-c5dc15","BOOBY-db42e3","BLZ-1d0442","GCHUNK-de10a4","MEX-2ee70b","ESNT-610350","PIG-73f662","PIELOS-9bf91d","TRENKI-38a22e","ZOD-ae2eff","HERO-7acef3","VEGGIE-6f656d","EBUDDIES-e18a04","PUNKS-78c565","PLANT2EARN-981e2f","ETFOUNDER-7a5bf7","RAVEN-a01ee3","AOL-0bf5c9","FATA-dd6967","BRICKS-8b0bcb","COMBEYS-bc640d","GODDESS-e427c8","EGG-4e8abe","ERTWO-3d1944","ENERGY-bf1f80","EMUSKV2-a65850","ESCAP-f0198a","EGLDDOGS-5ca4ef","ELVA-c26d0e","MIKI2KCAR-5fe95b","EGLDKONGZ-acc056","ALLTEAM-374106"]);