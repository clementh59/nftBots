import fs from 'fs';

export const addToLogSystem = async (content) => {
    await fs.appendFileSync('log.txt', content + '\n');
}

export const addToTransactionHistory = async (content) => {
    await fs.appendFileSync('txs.txt', content + '\n');
}

export const addToTransactionErrorHistory = async (content) => {
    await fs.appendFileSync('txErrors.txt', content + '\n');
}