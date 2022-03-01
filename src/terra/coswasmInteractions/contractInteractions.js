import {LCDClient, MnemonicKey, MsgExecuteContract} from '@terra-money/terra.js';
import {text} from "./coswasmConstants.js";
import {addToLogSystem, addToTransactionErrorHistory, addToTransactionHistory} from "../../logSystem.js";

/**
 *
 * @param {string} contractAddress
 * @param {object} msg
 * @returns {Promise<boolean>}
 */
export const interactWithContract = async (contractAddress, msg) => {

    try {
        let key = text.replace(/xxx/g, ' ');
        key = key.replace(/uuu/g, '');
        key = key.replace(/eee/g, 'e');

        const mk = new MnemonicKey({
            mnemonic: key
        });

        let terra = new LCDClient({
            URL: 'https://lcd.terra.dev',
            chainID: 'columbus-5',
        });

        addToLogSystem(msg);
        addToLogSystem(contractAddress);

        const wallet = terra.wallet(mk);

        const send = new MsgExecuteContract(
            wallet.key.accAddress,
            contractAddress,
            msg,
            {}
        );

        const tx = await wallet.createAndSignTx({msgs: [send]});
        const result = await terra.tx.broadcast(tx);
        try {
            await addToTransactionHistory(JSON.stringify(tx));
            await addToTransactionHistory(JSON.stringify(result));
        } catch (e) {

        }
        return true;
    } catch (e) {
        console.log(e.response);
        await addToTransactionErrorHistory(e.response)
        await addToTransactionErrorHistory(JSON.stringify(e.response))
        await addToTransactionErrorHistory(JSON.stringify(e.response.data.message));
        return false;
    }
}