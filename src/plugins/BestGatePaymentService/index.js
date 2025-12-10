/*
 * Module Payment Mopay
 * DESCRIPTION: tương tác với các api payment của BestGate
 * DOCUMENT: ???
 * AUTHOR: Kunkeyr - Vu Duy Luc
 * GITHUB: https://github.com/kunkey
 */

const axios = require('axios');
const md5 = require('md5');
const encrypt = require('./encrypt');
const config = require('@Configs/payment/autoGateBestGate.json');

const ENUM_MESSAGE = {
    SUCCESS_001: "success",
    ERROR_001: "there is a problem with the connection network's third-party system",
    ERROR_002: "The system is maintenance",
    ERROR_003: "third party data cannot be obtained",
    ERROR_004: "this bank not supports"
}

const objectToQueryString = (obj) => {
    return Object.entries(obj).reduce((acc, [key, val]) => {
        if (Array.isArray(val)) {
            val.forEach(e => acc += (acc ? "&" : "") + key + "=" + e);
        } else {
            acc += (acc ? "&" : "") + key + "=" + val;
        }
        return acc;
    }, "");
}

// tạo yêu cầu nạp bank/momo
const createRequest = async (transId, amount) => {
    const clientIp = "127.0.0.1";
    const timestampCrr = Date.now();

    const createReq = await axios({
        method: 'post',
        maxBodyLength: Infinity,
        url: config.entryPoint,
        headers: {
            'signature': encrypt.genAuthorization(
                config.client_id,
                config.client_secret
            ),
            'Content-Type': 'application/json'
        },
        data: JSON.stringify({
            "clientId": config.client_id,
            "invoiceId": transId,
            "amount": amount,
            "description": "deposit order " + transId,
            "redirectUrl": config.redirectUrl,
            "clientIp": "127.0.0.1",
            "timestamp": timestampCrr,
            "checksum": encrypt.genPaymentIntenChecksum(
                config.client_id,
                config.client_secret,
                amount,
                clientIp,
                transId,
                timestampCrr
            )
        })
    });

    if (!createReq) return {
        status: false,
        msg: ENUM_MESSAGE.ERROR_003
    };

    const resp = createReq.data;
    if (resp.status == 1) {
        return {
            status: true,
            msg: ENUM_MESSAGE.SUCCESS_001,
            data: resp
        }
    } else {
        return {
            status: false,
            msg: resp.message
        }
    }
}

module.exports = {
    createRequest
}