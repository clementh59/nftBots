import fs from "fs";
import {AbortController} from "node-abort-controller";
import fetch from 'node-fetch';
import {createRequire} from "module";
import {closeConnection} from "./terra/db/db.js";

const require = createRequire(import.meta.url);

export const priceInLuna = (priceInULuna) => {
    return priceInULuna / 1000000;
}

export const writeJSONToFile = (fileName, json) => {
    try {
        fs.writeFileSync(fileName, JSON.stringify(json))
    } catch (err) {
        console.error(err)
    }
}

export const timer = ms => new Promise(res => setTimeout(res, ms));

let cancelRequests = [];
let index = 0;

export const fetchWithTimeout = async (url, headers, timeout) => {
    const requestId = index++;
    try {
        cancelRequests.push({id: requestId, controller: new AbortController()});
        return await Promise.race([fetchWithAbort(url, headers, requestId), timeoutWithAbort(timeout, requestId)]);
    } catch (error) {
        throw new Error('timeout');
    }

}

async function fetchWithAbort(url, headers, cancelRequestId) {
    try {
        const cancelR = cancelRequests.find((i) => i.id === cancelRequestId);
        return await fetch(url, {...headers, signal: cancelR.controller.signal});
    } finally {

    }
}

async function timeoutWithAbort(delay, cancelRequestId) {
    try {
        await timer(delay);
        cancelRequests.find((i) => i.id === cancelRequestId).controller.abort();
        cancelRequests = cancelRequests.filter((i) => i.id !== cancelRequestId);
    } catch (e) {
    }
    throw new Error(`timeout`);
}

export const roundFloat = (i) => {
    return (Math.round(i * 10000).toFixed(2)) / 10000;
}

/////////////////////       BOT MAIN FUNCTION       /////////////

const lastTxsRetrieved = {
    "RandomEarth": 0
}

const retrieveAndAnalyzeTxsLoop = async (context, offset, txsToAnalyze) => {
    const {getLastTransactions, lastTransactionIdAnalyzed, instance, analyzeTransaction, timeBetweenRequests, endOfLoopTreatment} = context;
    const txs = await getLastTransactions(offset);
    txs.forEach((tx) => {
        if (tx.id > context.lastTransactionIdAnalyzed)
            txsToAnalyze.push(tx);
    });
    if (!offset)
        lastTxsRetrieved[instance] = txs[0].id;

    console.log(txs[0].id + ' - ' + txs[0].timestamp);

    if (/*lastTransactionIdAnalyzed < lastTxsRetrieved[instance]*/txs[0].timestamp > '2022-01-01T21:48:51Z') {
        await timer(timeBetweenRequests);
        return retrieveAndAnalyzeTxsLoop(context, txs.pop().id, txsToAnalyze);
    }

    console.log(`Analyzing ${txsToAnalyze.length} transactions`);

    for (let i = txsToAnalyze.length - 1; i >= 0; i--)
        await analyzeTransaction(txsToAnalyze[i]);

    // todo: add in a variable the collection that are updated, and analyze only these

    await endOfLoopTreatment();
    txsToAnalyze = [];
    await timer(timeBetweenRequests);
    // todo: remove
    console.log(`Last tx analyzed: ${lastTxsRetrieved.RandomEarth}`);
    await closeConnection();
    return;
    // todo: end remove
    return retrieveAndAnalyzeTxsLoop(context, 0, txsToAnalyze);
}

export const retrieveAndAnalyzeTxs = async (context) => {
    let txsToAnalyze = [];
    retrieveAndAnalyzeTxsLoop(context, 0, txsToAnalyze);
}