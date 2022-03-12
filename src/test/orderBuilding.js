import {expect} from "chai";
import {generateBuyOrderRandomEarth} from "../terra/randomEarth/randomEarthBot.js";

const samplePostOrder = {
    'Terrapin': {
        'post': {
            "ledger_proxy": {
                "msg": "{\"post_order\":{\"order\":{\"order\":{\"listing\":0,\"maker\":[116,101,114,114,97,49,109,52,102,116,56,106,54,110,112,117,118,118,103,52,110,114,117,51,108,107,104,99,53,57,106,101,55,101,97,112,120,114,103,53,99,110,97,55],\"maker_fee\":\"0\",\"taker_fee\":\"0\",\"version\":\"terra1eek0ymmhyzja60830xhzm7k7jkrk99a60q2z2t\",\"taker\":\"terra1eek0ymmhyzja60830xhzm7k7jkrk99a60q2z2t\",\"maker_asset\":{\"info\":{\"nft\":{\"contract_addr\":\"terra1f89xq3qhu98v4jch4y5xcrkhl9gytrne99x74t\",\"token_id\":\"94735216394512908420636626873214719262\"}},\"amount\":\"1\"},\"taker_asset\":{\"info\":{\"native_token\":{\"denom\":\"uluna\"}},\"amount\":\"1790000\"},\"fee_recipient\":\"accepting_counters\",\"nonce\":42010425,\"expiration\":1642707246},\"sig\":[]}}}"
            }
        },
        'execute': {
            "ledger_proxy": {
                "msg": "{\"execute_order\":{\"order\":{\"order\":{\"listing\":0,\"maker\":[116,101,114,114,97,49,109,52,102,116,56,106,54,110,112,117,118,118,103,52,110,114,117,51,108,107,104,99,53,57,106,101,55,101,97,112,120,114,103,53,99,110,97,55],\"maker_fee\":\"0\",\"taker_fee\":\"0\",\"version\":\"terra1eek0ymmhyzja60830xhzm7k7jkrk99a60q2z2t\",\"taker\":\"terra1eek0ymmhyzja60830xhzm7k7jkrk99a60q2z2t\",\"maker_asset\":{\"info\":{\"nft\":{\"contract_addr\":\"terra1f89xq3qhu98v4jch4y5xcrkhl9gytrne99x74t\",\"token_id\":\"94735216394512908420636626873214719262\"}},\"amount\":\"1\"},\"taker_asset\":{\"info\":{\"native_token\":{\"denom\":\"uluna\"}},\"amount\":\"1790000\"},\"expiration\":1642707246,\"fee_recipient\":\"accepting_counters\",\"nonce\":42010425},\"sig\":[]}}}"
            }
        }
    }
};

const sampleSendNft = {
    'Terrapin': {
        'post': {
            "send_nft": {
                "msg": "eyJwb3N0X29yZGVyIjp7Im9yZGVyIjp7Im9yZGVyIjp7Imxpc3RpbmciOjAsIm1ha2VyIjpbMTE2LDEwMSwxMTQsMTE0LDk3LDQ5LDEwNiwxMDYsMTA4LDExOSw1NSwxMTcsMTEyLDU2LDU0LDExMiwxMDYsMTE1LDExMCw1MiwxMTcsNTYsMTAyLDQ4LDEwMCwxMDQsMTIwLDEwOCw5Nyw1MywxMDEsMTAxLDEyMCwxMTcsMTIwLDQ4LDUwLDExOSw5OSw1MywxMTIsNTIsMTE2LDExOF0sIm1ha2VyX2ZlZSI6IjAiLCJ0YWtlcl9mZWUiOiIwIiwidmVyc2lvbiI6InRlcnJhMWVlazB5bW1oeXpqYTYwODMweGh6bTdrN2prcms5OWE2MHEyejJ0IiwidGFrZXIiOiJ0ZXJyYTFlZWsweW1taHl6amE2MDgzMHhoem03azdqa3JrOTlhNjBxMnoydCIsIm1ha2VyX2Fzc2V0Ijp7ImluZm8iOnsibmZ0Ijp7ImNvbnRyYWN0X2FkZHIiOiJ0ZXJyYTE2cnNzbmU4N2NrNnJzc2hnOThxcWo0eWxmdW00NmF4cDBrcGF6aiIsInRva2VuX2lkIjoiMzI0NzM5MzAyMTM3ODgwNTk4NDQzNjI3NzU2Njg1NTQ4MzMwNjYxIn19LCJhbW91bnQiOiIxIn0sInRha2VyX2Fzc2V0Ijp7ImluZm8iOnsibmF0aXZlX3Rva2VuIjp7ImRlbm9tIjoidWx1bmEifX0sImFtb3VudCI6IjM5MDAwMCJ9LCJmZWVfcmVjaXBpZW50IjoiYWNjZXB0aW5nX2NvdW50ZXJzIiwibm9uY2UiOjU0MDgzMDQ4LCJleHBpcmF0aW9uIjoxNjQ0Njg1MTE1fSwic2lnIjpbXX19fQ==",
                "contract": "terra1eek0ymmhyzja60830xhzm7k7jkrk99a60q2z2t",
                "token_id": "324739302137880598443627756685548330661"
            }
        },
        'execute':
            {
                "ledger_proxy": {
                    "msg": "{\"execute_order\":{\"order\":{\"order\":{\"listing\":0,\"maker\":[116,101,114,114,97,49,106,106,108,119,55,117,112,56,54,112,106,115,110,52,117,56,102,48,100,104,120,108,97,53,101,101,120,117,120,48,50,119,99,53,112,52,116,118],\"maker_fee\":\"0\",\"taker_fee\":\"0\",\"version\":\"terra1eek0ymmhyzja60830xhzm7k7jkrk99a60q2z2t\",\"taker\":\"terra1eek0ymmhyzja60830xhzm7k7jkrk99a60q2z2t\",\"maker_asset\":{\"info\":{\"nft\":{\"contract_addr\":\"terra16rssne87ck6rsshg98qqj4ylfum46axp0kpazj\",\"token_id\":\"324739302137880598443627756685548330661\"}},\"amount\":\"1\"},\"taker_asset\":{\"info\":{\"native_token\":{\"denom\":\"uluna\"}},\"amount\":\"390000\"},\"expiration\":1644685115,\"fee_recipient\":\"accepting_counters\",\"nonce\":54083048},\"sig\":[]}}}"
                }
            }
    }
}

/**
 * Useful to generate a tx that has the same structure as the ones in the db
 */
const wrapOrder = (postOrder) => {
    return {
        "type": "wasm/MsgExecuteContract",
        "value": {
            "coins": [],
            "sender": "terra19umuhxv5nlw70rsfq2434p6k3t5t334e28aszt",
            "contract": "terra1eek0ymmhyzja60830xhzm7k7jkrk99a60q2z2t",
            "execute_msg": postOrder,
        }
    }
}

describe('Buy order building - RandomEarth', function () {

    it('should build a buy order from a post order msg', async () => {
        expect(samplePostOrder.Terrapin.execute).to.deep
            .eq(generateBuyOrderRandomEarth(wrapOrder(samplePostOrder.Terrapin.post)));
    });

    it('should build a buy order from a send nft msg', async () => {
        expect(sampleSendNft.Terrapin.execute).to.deep
            .eq(generateBuyOrderRandomEarth(wrapOrder(sampleSendNft.Terrapin.post)));
    });

});