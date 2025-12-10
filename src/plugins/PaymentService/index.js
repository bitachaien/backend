/*
 * Module Payment Mopay
 * DESCRIPTION: tương tác với các api payment của Mopay
 * DOCUMENT: Mopay/doc/
 * AUTHOR: Kunkeyr - Vu Duy Luc
 * GITHUB: https://github.com/kunkey
 */

const axios = require('axios');
const md5 = require('md5');
const config = require('@Configs/payment/autoGateBank.json');
const configCard = require('@Configs/payment/autoGateCard.json');
const configUsdt = require('@Configs/payment/autoGateUsdt.json');

const ENUM_MESSAGE = {
    SUCCESS_001: "success",
    ERROR_001: "there is a problem with the connection network's third-party system",
    ERROR_002: "The system is maintenance",
    ERROR_003: "third party data cannot be obtained",
    ERROR_004: "this bank not supports",
    ERROR_005: "invalid response signature",
    ERROR_006: "bank code is required"
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

const parseResponseContent = (responseContent) => {
    if (!responseContent) return null;
    if (typeof responseContent === "string") {
        try {
            return JSON.parse(responseContent);
        } catch (e) {
            return responseContent;
        }
    }
    return responseContent;
}

const verifyFastPaySignature = (response, partnerKey) => {
    if (!response || !response.Signature || !partnerKey) return true;
    const rawContent = (typeof response.ResponseContent === "string")
        ? response.ResponseContent
        : JSON.stringify(response.ResponseContent || {});
    const signature = md5(
        `${response.ResponseCode || ""}${response.Description || ""}${rawContent}${partnerKey}`
    );
    return signature === response.Signature;
}

const normalizeFastPayOrder = (responseContent) => {
    if (!responseContent || typeof responseContent !== "object") return {};
    const normalized = {
        bank: responseContent.BankName,
        bankCode: responseContent.BankName,
        bankName: responseContent.BankAccountName,
        bankAccount: responseContent.BankAccountNumber,
        content: responseContent.RefCode,
        amount: Number(responseContent.Amount || 0),
        linkOpenApp: responseContent.LinkOpenApp,
        linkWebView: responseContent.LinkWebView,
        qrCode: responseContent.QRCode,
        qr_data: responseContent.QRCode,
        qrImageUrl: responseContent.LinkWebView,
        payment_url: responseContent.LinkWebView,
        orderNo: responseContent.OrderNo
    };

    normalized.paymentInfo = {
        bankShortName: normalized.bank,
        accountNumber: normalized.bankAccount,
        accountName: normalized.bankName,
        bankMessage: normalized.content,
        amount: normalized.amount,
        vietQrLink: normalized.linkWebView,
        qrValue: normalized.qrCode
    };

    return normalized;
}

// lấy danh sách bank code FastPay
const getListBankCode = async () => {
    try {
        const response = await axios.post(
            `${config.entryPoint}/bankin/info.ashx`,
            {
                PartnerCode: config.partnerCode
            },
            {
                headers: { 'Content-Type': 'application/json' }
            }
        );

        const resp = response?.data;
        if (!resp) {
            return { status: false, msg: ENUM_MESSAGE.ERROR_003 };
        }

        if (!verifyFastPaySignature(resp, config.partnerKey)) {
            return { status: false, msg: ENUM_MESSAGE.ERROR_005 };
        }

        if (resp.ResponseCode !== 1) {
            console.log('FastPay getListBankCode Error:', {
                ResponseCode: resp.ResponseCode,
                Description: resp.Description
            });
            // Chuyển đổi message tiếng Anh sang tiếng Việt nếu cần
            let errorMsg = resp.Description || ENUM_MESSAGE.ERROR_003;
            if (errorMsg && errorMsg.toLowerCase().includes('maintain')) {
                errorMsg = 'Hệ thống đang bảo trì, vui lòng thử lại sau!';
            }
            return {
                status: false,
                msg: errorMsg
            };
        }

        const data = parseResponseContent(resp.ResponseContent) || [];

        return {
            status: true,
            msg: ENUM_MESSAGE.SUCCESS_001,
            data
        };
    } catch (e) {
        console.log(e);
        return {
            status: false,
            msg: e.message
        };
    }
}

// tạo yêu cầu nạp bank FastPay (yêu cầu chọn bankCode)
const createRequest = async (transId, amount, bankCode, callbackUrl = config.callbackUrl) => {
    try {
        if (!bankCode) {
            return { status: false, msg: ENUM_MESSAGE.ERROR_006 };
        }

        const payload = {
            PartnerCode: config.partnerCode,
            BankCode: bankCode,
            RefCode: transId,
            Amount: Number(amount),
            CallbackUrl: callbackUrl
        };
        payload.Signature = md5(`${payload.PartnerCode}${payload.BankCode}${payload.Amount}${payload.RefCode}${payload.CallbackUrl || ""}${config.partnerKey}`);

        const response = await axios.post(
            `${config.entryPoint}/bankin/Order.ashx`,
            payload,
            {
                headers: { 'Content-Type': 'application/json' }
            }
        );

        const resp = response?.data;
        if (!resp) {
            return { status: false, msg: ENUM_MESSAGE.ERROR_003 };
        }

        if (!verifyFastPaySignature(resp, config.partnerKey)) {
            return { status: false, msg: ENUM_MESSAGE.ERROR_005 };
        }

        if (resp.ResponseCode !== 1) {
            console.log('FastPay createRequest Error:', {
                ResponseCode: resp.ResponseCode,
                Description: resp.Description,
                payload: { transId, amount, bankCode }
            });
            // Chuyển đổi message tiếng Anh sang tiếng Việt nếu cần
            let errorMsg = resp.Description || ENUM_MESSAGE.ERROR_003;
            if (errorMsg && errorMsg.toLowerCase().includes('maintain')) {
                errorMsg = 'Hệ thống đang bảo trì, vui lòng thử lại sau!';
            }
            return {
                status: false,
                msg: errorMsg
            };
        }

        const parsedContent = parseResponseContent(resp.ResponseContent);
        const normalized = normalizeFastPayOrder(parsedContent);

        return {
            status: true,
            msg: ENUM_MESSAGE.SUCCESS_001,
            data: normalized
        };
    } catch (e) {
        console.log(e);
        return {
            status: false,
            msg: e.message
        };
    }
}

// FastPay hiện không hỗ trợ rút tiền trong tích hợp này
const createRequestWithdrawBank = async () => {
    return {
        status: false,
        msg: "FastPay integration does not support auto withdraw"
    };
}

const createRequestWithdrawMomo = async () => {
    return {
        status: false,
        msg: "FastPay integration does not support auto withdraw"
    };
}

const createRequestMomoDeposit = async () => {
    return {
        status: false,
        msg: "FastPay integration does not support auto wallet deposit"
    };
}

// mapping card code 
const mapCardCode = (cardCode, reverseType = true) => {
    const cardObj = {
        VIETTEL: 'viettel',
        MOBIFONE: 'vms',
        VINAPHONE: 'vnp'
    };

    let codeReturn = null;

    if (reverseType) {
        for (var key in cardObj) {
            if (cardObj.hasOwnProperty(key)) {
                if (cardCode === key) {
                    codeReturn = cardObj[key];
                    break;
                }
            }
        }
        return {
            status: (!codeReturn) ? false : true,
            code: codeReturn,
            msg: ENUM_MESSAGE.SUCCESS_001
        }
    } else {
        for (var key in cardObj) {
            if (cardObj.hasOwnProperty(key)) {
                if (cardCode === cardObj[key]) {
                    codeReturn = key;
                    break;
                }
            }
        }
        return {
            status: (!codeReturn) ? false : true,
            code: codeReturn,
            msg: ENUM_MESSAGE.SUCCESS_001
        }
    }
}

// lấy danh sách cardcode
const getCardData = () => {
    return {
        status: true,
        data: {
            cardCode: [
                "VIETTEL",
                "VINAPHONE",
                "MOBIFONE"
            ],
            amountValue: Array.isArray(configCard.amounts) && configCard.amounts.length
                ? configCard.amounts
                : [
                    10000,
                    20000,
                    30000,
                    50000,
                    100000,
                    200000,
                    300000,
                    500000
                ]
        },
        msg: ENUM_MESSAGE.SUCCESS_001
    }
}

// tạo yêu cầu nạp thẻ
const createRequestCard = async (transId, network, amount, pin, seri) => {
    try {
        if (!configCard.partnerCode || !configCard.partnerKey) {
            return {
                status: false,
                msg: "FastPay card gateway is not configured"
            };
        }

        const requestContentObj = {
            CardSerial: String(seri).trim(),
            CardCode: String(pin).trim(),
            CardType: network,
            AccountName: configCard.accountName || "FASTPAY_CARD",
            RefCode: String(transId),
            AmountUser: Number(amount)
        };

        if (configCard.callback_url) {
            requestContentObj.CallbackUrl = configCard.callback_url;
        }

        const payload = {
            PartnerCode: configCard.partnerCode,
            ServiceCode: configCard.serviceCode || "cardtelco",
            CommandCode: configCard.commandCode || "usecard",
            RequestContent: JSON.stringify(requestContentObj)
        };

        payload.Signature = md5(`${payload.PartnerCode}${payload.ServiceCode}${payload.CommandCode}${payload.RequestContent}${configCard.partnerKey}`);

        const response = await axios.post(
            configCard.entryPoint,
            payload,
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );

        if (!response) {
            return {
                status: false,
                msg: ENUM_MESSAGE.ERROR_003
            };
        }

        const resp = response.data || {};

        if (Number(resp.ResponseCode) !== 6) {
            return {
                status: false,
                msg: resp.Description || ENUM_MESSAGE.ERROR_003,
                data: resp
            };
        }

        const parsedContent = parseResponseContent(resp.ResponseContent);

        const normalized = {
            amount: Number(parsedContent?.Amount || parsedContent?.amount || amount),
            responseCode: resp.ResponseCode,
            description: resp.Description,
            responseContent: parsedContent,
            request: requestContentObj
        };

        return {
            status: true,
            msg: ENUM_MESSAGE.SUCCESS_001,
            data: normalized
        };
    } catch (e) {
        console.log('FastPay createRequestCard error:', e);
        return {
            status: false,
            msg: e.message
        };
    }
}

// tạo yêu cầu nạp usdt
const createRequestUsdt = async (transId, amount, subType, sender, callback = false) => {
    try {
        let queryString = {};
        queryString.apiKey = configUsdt.apikey;
        queryString.chargeType = "usdt";
        queryString.amount = Number(amount);
        queryString.requestId = transId;
        queryString.subType = subType;
        queryString.phoneSender = sender;
        if (callback) queryString.callback = configUsdt.callback_url;

        const createReq = await axios({
            method: 'get',
            url: `${configUsdt.entryPoint}/api/MM/RegCharge?${objectToQueryString(queryString)}`,
            headers: {
                'accept': 'application/json'
            }
        });
        if (!createReq) return {
            status: false,
            msg: ENUM_MESSAGE.ERROR_003
        };

        const resp = createReq.data;
        if (resp.stt !== 1) {
            return {
                status: false,
                msg: resp.msg
            }
        } else {
            return {
                status: true,
                msg: ENUM_MESSAGE.SUCCESS_001,
                data: resp.data
            }
        }
    } catch (e) {
        console.log(e);
        return {
            status: false,
            msg: e.message
        };
    }
}

module.exports = {
    getListBankCode,
    createRequest,
    createRequestWithdrawBank,
    createRequestWithdrawMomo,
    createRequestMomoDeposit,
    mapCardCode,
    getCardData,
    createRequestCard,
    createRequestUsdt
}