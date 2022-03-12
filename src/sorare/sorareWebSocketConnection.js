import { ActionCable } from '@sorare/actioncable';
import {getValueInUSD} from "./ethPriceFeed.js";

const cable = new ActionCable({
    headers: {
        'Authorization': `Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI0NzE2NGUxMS0xZjRiLTRmOGItYmQxNC0zMzU2ZWFiN2JhMjMiLCJzY3AiOiJ1c2VyIiwiYXVkIjoiUlBJX0JPVCIsImlhdCI6MTY0NjI1NzQ4NywiZXhwIjoiMTY3NzgxNDQzOSIsImp0aSI6IjJjODdjOGFiLThmMDAtNGY0MS1iZDhhLTI1YTEzMTdjYzJkOSJ9.BP9s3DpNJA-NA4HMMbNV2kkLFTzaumLAABfs-U6CYrA`,
        // 'APIKEY': '<YourOptionalAPIKey>'
    }
});

export const startCableSubscription = () => {
    cable.subscribe('publicMarketWasUpdated { slug, name, ownerWithRates { price, transferType }, latestEnglishAuction { bidsCount, minNextBid, endDate }, season { name } }', {

        connected() {
            console.log("connected");
        },

        received(data) {
            try {
                const item = data?.result?.data?.publicMarketWasUpdated;
                if (item.latestEnglishAuction) {
                    // it is an auction
                    let {minNextBid, endDate} = item.latestEnglishAuction;
                    const {slug, name} = item;
                    const season = item.season.name;
                    minNextBid = getValueInUSD(minNextBid/(1e18));
                    console.log(`${name} current bid is ${minNextBid}$`)
                } else if (item.ownerWithRates && item.ownerWithRates.transferType === 'single_sale_offer') {
                    // it is a direct buy
                    let {price} = item.ownerWithRates;
                    const {slug, name} = item;
                    const season = item.season.name;
                    price = getValueInUSD(price/(1e18));
                    // todo: don't confuse offer and listing!!
                    console.log(`${name} listed at ${price}$`);
                } else {
                    console.log("We don't handle this type :")
                    console.log(item);
                }
            } catch (e) {}
        }
    });
}