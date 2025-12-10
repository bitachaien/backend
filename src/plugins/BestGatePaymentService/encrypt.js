const CryptoJS = require('crypto-js');

const sha256 = (message) => {
    const hash = CryptoJS.SHA256(message).toString();
    return hash;
};

const genAuthorization = (clientId, clientSecret) => {
    const hash = sha256(`${clientId}${clientSecret}`);
    return hash;
};

const genPaymentIntenChecksum = (clientId, clientSecret, amount, clientIp, invoiceId, timestamp) => {
    const message = [clientId, clientSecret, amount, clientIp, invoiceId, timestamp].join('');
    const hash = sha256(message);
    return hash;
};

const genNoticeChecksum = (clientSecret, amount, failureReason, invoiceId, payId, description, status) => {
    const message = [clientSecret, amount, failureReason, invoiceId, payId, description, status].join('');
    const hash = sha256(message);
    return hash;
};

module.exports = {
    sha256,
    genAuthorization,
    genPaymentIntenChecksum,
    genNoticeChecksum
}