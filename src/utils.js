import fs from "fs";
import {AbortController} from "node-abort-controller";
import fetch from 'node-fetch';
import {createRequire} from "module";
import {addToLogSystem} from "./logSystem.js";
import nodemailer from 'nodemailer';
import {exec} from 'child_process'
import dotenv from 'dotenv';
const require = createRequire(import.meta.url);

dotenv.config();

let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.MAIL_FROM,
        pass: process.env.MAIL_FROM_PWD
    }
});

let mailOptions = {
    from: process.env.MAIL_FROM,
    to: process.env.MAIL_TO,
    subject: 'Sending Email using Node.js',
    text: 'That was easy!'
};

export const sendMail = (text, obj) => {
    console.log({
        user: process.env.MAIL_FROM,
        pass: process.env.MAIL_FROM_PWD
    })
    mailOptions.subject = obj;
    mailOptions.text = text;
    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error);
        } else {
            //console.log('Email sent: ' + info.response);
        }
    });
}

export const priceInLuna = (priceInULuna) => {
    return priceInULuna / 1000000;
}

export const priceInUst = (priceInUst) => {
    return priceInUst / 1000000;
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

export const isAMochaTest = () => typeof global.it === 'function';

export const openURLInChrome = (url) => {
    exec(`open -a "Google Chrome" ${url}`);
}

/////////////////////       BOT MAIN FUNCTION       /////////////

const lastTxsRetrieved = {
    "RandomEarth": null,
    "TrustMarket": null,
}

const retrieveAndAnalyzeTxsLoop = async (context, offset, txsToAnalyze) => {
    const {txHasBeenAnalyzed, lastTxAnalyzed, getLastTransactions, instance, analyzeTransaction, timeBetweenRequests, endOfLoopTreatment, setLastTransactionAnalyzed} = context;
    const txs = await getLastTransactions(offset);

    txs.forEach((tx) => {
        if (!txHasBeenAnalyzed(tx, lastTxAnalyzed))
            txsToAnalyze.push(tx);
    });
    if (!offset)
        lastTxsRetrieved[instance] = txs[0];

    console.log(txs[0].timestamp);
    addToLogSystem(txs[0].timestamp);

    if (
        !txHasBeenAnalyzed(txs[0], lastTxAnalyzed)
        //txs[0].timestamp > '2022-03-21T00:48:51Z'
    ) {
        await timer(timeBetweenRequests);
        // todo: offset + 50 won't work for terra
        return retrieveAndAnalyzeTxsLoop(context, offset + 50, txsToAnalyze);
        //return retrieveAndAnalyzeTxsLoop(context, txs.pop().id, txsToAnalyze);
    }
    for (let i = txsToAnalyze.length - 1; i >= 0; i--) {
        if (txHasBeenAnalyzed(txsToAnalyze[i], lastTxAnalyzed))
            break;
        await analyzeTransaction(txsToAnalyze[i]);
    }

    context.lastTxAnalyzed = await setLastTransactionAnalyzed(lastTxsRetrieved[instance]);
    await endOfLoopTreatment();
    txsToAnalyze = [];
    await timer(timeBetweenRequests);
    return retrieveAndAnalyzeTxsLoop(context, 0, txsToAnalyze);
}

export const retrieveAndAnalyzeTxs = async (context) => {
    let txsToAnalyze = [];
    retrieveAndAnalyzeTxsLoop(context, 0, txsToAnalyze);
}
