const fs = require('fs');
const moment = require("moment-timezone");
moment.tz.setDefault("Asia/Ho_Chi_Minh");
const {
    ERROR_PAGE,
    ERROR_FORM,
    ERROR_AUTH,
    ERROR_AUTH_MESSAGE,
    ERROR_MESSAGES
} = require("@Helpers/contants");
const Helper = require("@Helpers/helpers");
const { parseInt } = require("@Helpers/Number");
const { numberWithCommas } = require("@Helpers/helpers");
const { randomString } = require("@Helpers/String");
const { BankHistoryModel } = require("@Models/Bank/BankHistory");
const { CardHistoryModel } = require("@Models/Card/CardHistory");
const { UserModel } = require("@Models/User/User");
const { UserIncentiveModel } = require("@Models/User/UserIncentive");
const { WithdrawConditionModel } = require("@Models/Withdraw/WithdrawCondition");
const teleBotSendMsg = require('@Plugins/TelegramBot');
const BalanceFluct = require("@Models/User/BalanceFluct");

const USDT_RATE_ENUM = 23.500; // số tiền quy đổi sang VND/1$
const BONUS_DEPOSIT_PERCENT = 0; //  0.5%
const CARD_FEE_PERCENT = 25; //  20%
const FIRST_DEPOSIT_CONDITION = { // nạp đầu tân thủ
    AMOUNT: 0, // số tiền nạp chính xác 
    BONUS_EXP: 0 // số tiền nạp nhân lên 
};


const CHARGE_TYPE_ENUM = {
    BANK: 'bank',
    WALLET: 'wallet',
    USDT: 'usdt',
    CARD: 'card'
};

const TRANSTYPE_ENUM = {
    DEPOSIT: 'deposit',
    WITHDRAW: 'withdraw'
};

const STATUS_ENUM = {
    SUCCESS: 'success',
    ERROR: 'error',
    PROCESSING: 'processing',
    CANCEL: 'cancel',
    PENDING: 'pending',
    DELETED: 'deleted',
    TIMEOUT: 'timeout'
}

const RESPONSIVE_MESSAGE = {
    TRANSACTION_NOT_SUPPORTED: "Transaction type not supported!",
    TRANSACTION_NOT_FOUND: "No transaction found!",
    SOMETHING_WENT_WRONG: "Something went wrong, please try again!",
    STASTUS_NOT_SUPPORTED: "Status not supported!",
    SUCCESS: "success"
}

module.exports = {
    Recharge: async (req, res, socket) => {
        try {
            let data = req.query;
            // console.log(data);

            const requestId = data.requestId;

            if (data.chargeType == CHARGE_TYPE_ENUM.BANK || data.chargeType == CHARGE_TYPE_ENUM.WALLET) {
                if (data.transType == TRANSTYPE_ENUM.WITHDRAW) return res.json({
                    status: true,
                    msg: "okok withdraw callback! i'm known it"
                });

                let match = {};
                match.transId = requestId;
                match.type = BankHistoryModel.TYPE_ENUM.RECHARGE;
                match.status = BankHistoryModel.STATUS_ENUM.PROCESSING;

                const record = await BankHistoryModel.findOne({ where: match });

                if (!!record) {
                    switch (data.status) {
                        case STATUS_ENUM.SUCCESS:
                            record.status = BankHistoryModel.STATUS_ENUM.SUCCESS;
                            record.amount = Number(data.actAmount);

                            const user = await UserModel.findOne({
                                where: { id: record.uid },
                                attributes: { exclude: ["password", "deletedAt", "code", "status", "role", "updatedAt"] },
                            });
                            // set user balance
                            if (user) {
                                let amountActuallyReceived = 0;
                                let isFirstDeposit = false;

                                // check order exitst by user
                                const depositBank = await BankHistoryModel.findAll({
                                    where: {
                                        uid: user.id,
                                        type: BankHistoryModel.TYPE_ENUM.RECHARGE,
                                        status: BankHistoryModel.STATUS_ENUM.SUCCESS,
                                        is_first: BankHistoryModel.IS_FIRST.TRUE
                                    }
                                });
                                const depositCard = await CardHistoryModel.findAll({
                                    where: {
                                        uid: user.id,
                                        type: CardHistoryModel.TYPE_ENUM.RECHARGE,
                                        status: CardHistoryModel.STATUS_ENUM.SUCCESS,
                                        is_first: CardHistoryModel.IS_FIRST.TRUE
                                    }
                                });

                                // if have deposit order else is first = true;
                                if (depositBank.length == 0 && depositCard.length == 0) isFirstDeposit = true;

                                record.is_first = isFirstDeposit;

                                if (isFirstDeposit) {
                                    if (Number(data.actAmount) == FIRST_DEPOSIT_CONDITION.AMOUNT) {
                                        amountActuallyReceived = Number(data.actAmount) * FIRST_DEPOSIT_CONDITION.BONUS_EXP;
                                    } else {
                                        amountActuallyReceived = Number(data.actAmount) + (Number(data.actAmount) * BONUS_DEPOSIT_PERCENT / 100);
                                    }
                                } else {
                                    amountActuallyReceived = Number(data.actAmount) + (Number(data.actAmount) * BONUS_DEPOSIT_PERCENT / 100);
                                }

                                user.coin += Number(amountActuallyReceived);
                                await user.save();
                                await user.reload();

                                const userJson = user.toJSON();
                                const rechargeType = (data.chargeType == CHARGE_TYPE_ENUM.WALLET) ? "ví điện tử" : "ngân hàng";

                                // create balance fluctuation
                                await BalanceFluct.createBalaceFluct(
                                    user.id,
                                    BalanceFluct.BalanceFluctModel.ACTION_ENUM.DEPOSIT,
                                    BalanceFluct.BalanceFluctModel.TYPE_ENUM.PLUS,
                                    Number(amountActuallyReceived),
                                    user.coin,
                                    `Nạp tiền ${rechargeType} - Nạp ${Helper.numberWithCommas(Number(data.actAmount))} ${(isFirstDeposit) ? "- Thưởng nạp đầu " + Helper.numberWithCommas(FIRST_DEPOSIT_CONDITION.BONUS_EXP) : "- Tặng 0.5% " + Helper.numberWithCommas(Number(data.actAmount) * BONUS_DEPOSIT_PERCENT / 100)}} - cộng ${Helper.numberWithCommas(amountActuallyReceived)}`
                                );

                                const botTeleConfig = require('@Configs/telegram/bot.json');
                                const chatTeleConfig = require('@Configs/telegram/chatGroup.json');
                                const messageTeleConfig = require('@Configs/telegram/message.json');

                                // thông báo telegram
                                if (botTeleConfig.status) {
                                    const time = moment().format("DD/MM/YYYY HH:MM:ss");
                                    const username = userJson.username;
                                    const name = userJson.name;
                                    const phone = userJson.phone;
                                    const email = userJson.email;
                                    const amount = Helper.numberWithCommas(Number(data.actAmount));
                                    const trans_id = requestId;
                                    const chargeTypeProvide = data.chargeType.toUpperCase();
                                    const chargeTypeProvideVi = rechargeType;

                                    await teleBotSendMsg(chatTeleConfig.paymentBank, messageTeleConfig.paymentBank, {
                                        '{{time}}': time,
                                        '{{username}}': username,
                                        '{{name}}': name,
                                        '{{phone}}': phone,
                                        '{{email}}': email,
                                        '{{amount}}': amount,
                                        '{{balance}}': Helper.numberWithCommas(user.coin),
                                        '{{transId}}': trans_id,
                                        '{{chargeTypeProvide}}': chargeTypeProvide,
                                        '{{chargeTypeProvideVi}}': chargeTypeProvideVi
                                    });
                                }
                            }



                            // set withdraw condition
                            const userConditionWithdraw = await WithdrawConditionModel.findByUserId(record.uid);
                            if (userConditionWithdraw) {
                                userConditionWithdraw.totalMinimumBetAmount += Number(data.actAmount);
                                await userConditionWithdraw.save();
                                userConditionWithdraw.reload();
                            }

                            break;
                        case STATUS_ENUM.ERROR:
                            record.status = BankHistoryModel.STATUS_ENUM.ERROR;
                            break;
                        case STATUS_ENUM.TIMEOUT:
                            record.status = BankHistoryModel.STATUS_ENUM.TIMEOUT;
                            break;
                        case STATUS_ENUM.CANCEL:
                            record.status = BankHistoryModel.STATUS_ENUM.ERROR;
                            break;
                        default:
                            record.status = BankHistoryModel.STATUS_ENUM.ERROR;
                            break;
                    }

                    await record.save();
                    await record.reload();

                    return res.json({
                        status: true,
                        msg: RESPONSIVE_MESSAGE.SUCCESS
                    });
                } else {
                    return res.json({
                        status: false,
                        msg: RESPONSIVE_MESSAGE.TRANSACTION_NOT_FOUND
                    });
                }
            }



            if (data.chargeType == CHARGE_TYPE_ENUM.CARD) {
                if (data.transType == TRANSTYPE_ENUM.WITHDRAW) return res.json({
                    status: true,
                    msg: "okok withdraw callback! i'm known it"
                });

                let match = {};
                match.transId = requestId;
                match.type = CardHistoryModel.TYPE_ENUM.RECHARGE;
                match.status = CardHistoryModel.STATUS_ENUM.PENDING;

                const record = await CardHistoryModel.findOne({ where: match });

                if (!!record) {
                    switch (data.status) {
                        case STATUS_ENUM.SUCCESS:
                            record.status = CardHistoryModel.STATUS_ENUM.SUCCESS;
                            record.amount = Number(data.actAmount);

                            const user = await UserModel.findOne({
                                where: { id: record.uid },
                                attributes: { exclude: ["password", "deletedAt", "code", "status", "role", "updatedAt"] },
                            });
                            if (user) {
                                const MINUS_AMOUNT = Number(data.actAmount) * CARD_FEE_PERCENT / 100;
                                const amountActuallyReceived = Number(data.actAmount) - MINUS_AMOUNT;


                                user.coin += Number(amountActuallyReceived) + (Number(data.actAmount) * BONUS_DEPOSIT_PERCENT / 100);
                                await user.save();
                                await user.reload();

                                const userJson = user.toJSON();

                                // create balance fluctuation
                                await BalanceFluct.createBalaceFluct(
                                    user.id,
                                    BalanceFluct.BalanceFluctModel.ACTION_ENUM.DEPOSIT,
                                    BalanceFluct.BalanceFluctModel.TYPE_ENUM.PLUS,
                                    Number(amountActuallyReceived),
                                    user.coin,
                                    `Nạp tiền thẻ cào ${Helper.numberWithCommas(data.actAmount)} - cộng ${Helper.numberWithCommas(amountActuallyReceived)} - (phí ${CARD_FEE_PERCENT}%)`
                                );

                                const botTeleConfig = require('@Configs/telegram/bot.json');
                                const chatTeleConfig = require('@Configs/telegram/chatGroup.json');
                                const messageTeleConfig = require('@Configs/telegram/message.json');

                                // thông báo telegram
                                if (botTeleConfig.status) {
                                    const time = moment().format("DD/MM/YYYY HH:MM:ss");
                                    const username = userJson.username;
                                    const name = userJson.name;
                                    const phone = userJson.phone;
                                    const email = userJson.email;
                                    const amount = Helper.numberWithCommas(Number(actAmount));
                                    const trans_id = requestId;
                                    const network = card.network;
                                    const pin = card.pin;
                                    const seri = card.seri;

                                    await teleBotSendMsg(chatTeleConfig.paymentCard, messageTeleConfig.paymentCard, {
                                        '{{time}}': time,
                                        '{{username}}': username,
                                        '{{name}}': name,
                                        '{{phone}}': phone,
                                        '{{email}}': email,
                                        '{{amount}}': amount,
                                        '{{balance}}': Helper.numberWithCommas(user.coin),
                                        '{{transId}}': trans_id,
                                        '{{network}}': network,
                                        '{{pin}}': pin,
                                        '{{seri}}': seri
                                    });
                                }


                            }
                            // set withdraw condition
                            const userConditionWithdraw = await WithdrawConditionModel.findByUserId(record.uid);
                            if (userConditionWithdraw) {
                                userConditionWithdraw.totalMinimumBetAmount += Number(data.actAmount);
                                await userConditionWithdraw.save();
                                userConditionWithdraw.reload();
                            }
                            break;
                        case STATUS_ENUM.ERROR:
                            record.status = CardHistoryModel.STATUS_ENUM.ERROR;
                            break;
                        // case STATUS_ENUM.TIMEOUT:
                        //     record.status = CardHistoryModel.STATUS_ENUM.TIMEOUT;
                        //     break;
                        // case STATUS_ENUM.CANCEL:
                        //     record.status = CardHistoryModel.STATUS_ENUM.ERROR;
                        //     break;
                        default:
                            record.status = CardHistoryModel.STATUS_ENUM.ERROR;
                            break;
                    }

                    await record.save();
                    await record.reload();

                    return res.json({
                        status: true,
                        msg: RESPONSIVE_MESSAGE.SUCCESS
                    });
                } else {
                    return res.json({
                        status: false,
                        msg: RESPONSIVE_MESSAGE.TRANSACTION_NOT_FOUND
                    });
                }
            }

            return res.json({
                status: false,
                msg: RESPONSIVE_MESSAGE.SOMETHING_WENT_WRONG
            });
        } catch (e) {
            console.log(e);
            return res.json({
                status: false,
                msg: RESPONSIVE_MESSAGE.SOMETHING_WENT_WRONG
            });
        }
    },
    RechargeWallet: async (req, res, socket) => {
        try {
            const {
                amount,
                uid,
                signature
            } = req.query;

            if (!amount || !uid || !signature) {
                return res.json({
                    status: false,
                    msg: ERROR_FORM.MISSING_FIELD
                });
            }

        } catch (e) {
            console.log(e);
            return res.json({
                status: false,
                msg: RESPONSIVE_MESSAGE.SOMETHING_WENT_WRONG
            });
        }
    },
    RechargeCard: async (req, res, socket) => {
        try {
            const {
                id,
                menhGiaThe,
                menhGiaDK,
                menhGiaThuc,
                status,
                requestId,
                signature
            } = req.query;

            if (!id || !menhGiaThe || !menhGiaDK || !menhGiaThuc || !status || !signature || !requestId) {
                return res.json({
                    status: false,
                    msg: ERROR_FORM.MISSING_FIELD
                });
            }

            const botTeleConfig = JSON.parse(fs.readFileSync(process.env.PWD + "/src/configs/telegram/bot.json", "utf8"));
            const chatTeleConfig = JSON.parse(fs.readFileSync(process.env.PWD + "/src/configs/telegram/chatGroup.json", "utf8"));
            const messageTeleConfig = JSON.parse(fs.readFileSync(process.env.PWD + "/src/configs/telegram/message.json", "utf8"));

            const card = await CardHistoryModel.findOne({
                where: {
                    transId: requestId,
                    type: CardHistoryModel.TYPE_ENUM.RECHARGE,
                    status: CardHistoryModel.STATUS_ENUM.PENDING
                }
            });

            if (!!card) {
                const isSuccessStatus = status == STATUS_ENUM.SUCCESS || Number(status) === 1 || status === '1';

                if (isSuccessStatus) {
                    card.status = CardHistoryModel.STATUS_ENUM.SUCCESS;
                    card.amount = Number(menhGiaThuc);
                    await card.save();
                    await card.reload();

                    const user = await UserModel.findOne({
                        where: { id: card.uid },
                        attributes: { exclude: ["password", "deletedAt", "code", "status", "role", "updatedAt"] },
                    });

                    user.coin += Number(menhGiaThuc);
                    await user.save();
                    await user.reload();

                    const userJson = user.toJSON();
                    delete userJson.password;
                    delete userJson.verify;
                    delete userJson.status;
                    delete userJson.updatedAt;
                    delete userJson.role;
                    delete userJson.isPlay;
                    delete userJson.deletedAt;
                    delete userJson.createdAt;
                    delete userJson.code;

                    socket.sendToUser(user.id, {
                        notify: {
                            type: "recharge",
                            title: `Nạp thẻ cào thành công!`,
                            message: `<p style=" text-align: center; font-size: 26px; ">Bạn vừa nạp thành công ${numberWithCommas(Number(menhGiaThuc))} điểm!</p>`
                        },
                        user: userJson
                    });


                    // thông báo telegram
                    if (botTeleConfig.status) {
                        const time = moment().format("DD/MM/YYYY HH:MM:ss");
                        const username = userJson.username;
                        const name = userJson.name;
                        const phone = userJson.phone;
                        const email = userJson.email;
                        const amount = Helper.numberWithCommas(Number(menhGiaThuc));
                        const trans_id = requestId;
                        const network = card.network;
                        const pin = card.pin;
                        const seri = card.seri;

                        await teleBotSendMsg(chatTeleConfig.paymentCard, messageTeleConfig.paymentCard, {
                            '{{time}}': time,
                            '{{username}}': username,
                            '{{name}}': name,
                            '{{phone}}': phone,
                            '{{email}}': email,
                            '{{amount}}': amount,
                            '{{transId}}': trans_id,
                            '{{network}}': network,
                            '{{pin}}': pin,
                            '{{seri}}': seri
                        });
                    }

                    return res.json({
                        status: true,
                        msg: RESPONSIVE_MESSAGE.SUCCESS
                    });

                } else if (status == STATUS_ENUM.DELETED) {
                    card.status = CardHistoryModel.STATUS_ENUM.ERROR;
                    await card.save();
                    await card.reload();
                    socket.sendToUser(card.uid, {
                        notify: {
                            type: "recharge",
                            title: `Nạp thẻ thất bại!`,
                            message: `<p style=" text-align: center; font-size: 26px; ">Nạp thẻ cào thất bại!</p>`
                        }
                    });
                    return res.json({
                        status: true,
                        msg: RESPONSIVE_MESSAGE.SUCCESS
                    });
                }
            } else {
                return res.json({
                    status: false,
                    msg: RESPONSIVE_MESSAGE.TRANSACTION_NOT_FOUND
                });
            }
        } catch (e) {
            console.log(e);
            return res.json({
                status: false,
                msg: RESPONSIVE_MESSAGE.SOMETHING_WENT_WRONG
            });
        }
    },
    BestGate: async (req, res, socket) => {
        try {
            console.log("* Recharge Callback Data: ", req.body);

            const {
                clientId,
                checksum,
                result
            } = req.body;

            if (!clientId || !checksum) return res.status(200).json({
                status: false,
                msg: ERROR_FORM.MISSING_FIELD
            });

            const data = result;
            const requestId = data.invoiceId;

            let match = {};
            match.transId = requestId;
            match.type = BankHistoryModel.TYPE_ENUM.RECHARGE;
            match.status = BankHistoryModel.STATUS_ENUM.PROCESSING;

            const record = await BankHistoryModel.findOne({ where: match });

            if (!record) return res.status(200).json({
                status: false,
                msg: RESPONSIVE_MESSAGE.TRANSACTION_NOT_FOUND
            });

            switch (data.status) {
                case 3:
                    record.status = BankHistoryModel.STATUS_ENUM.SUCCESS;
                    record.amount = Number(data.amount);

                    const user = await UserModel.findOne({
                        where: { id: record.uid },
                        attributes: { exclude: ["password", "deletedAt", "code", "status", "updatedAt"] },
                    });

                    if (!user) return res.status(200).json({
                        status: false,
                        msg: RESPONSIVE_MESSAGE.SOMETHING_WENT_WRONG
                    });

                    let amountActuallyReceived = 0;
                    let isFirstDeposit = false;

                    // check order exitst by user
                    const [depositBank, depositCard] = await Promise.all([
                        await BankHistoryModel.findAll({
                            where: { uid: user.id, type: BankHistoryModel.TYPE_ENUM.RECHARGE, is_first: BankHistoryModel.IS_FIRST.TRUE }
                        }),
                        await CardHistoryModel.findAll({
                            where: { uid: user.id, type: CardHistoryModel.TYPE_ENUM.RECHARGE, is_first: BankHistoryModel.IS_FIRST.TRUE }
                        })
                    ]);

                    // if have deposit order else is first = true;
                    if (depositBank.length == 0 && depositCard.length == 0) isFirstDeposit = true;
                    record.is_first = isFirstDeposit;

                    if (isFirstDeposit) {
                        if (Number(data.amount) == FIRST_DEPOSIT_CONDITION.AMOUNT) {
                            amountActuallyReceived = Number(data.amount) * FIRST_DEPOSIT_CONDITION.BONUS_EXP;
                        } else {
                            amountActuallyReceived = Number(data.amount) + (Number(data.amount) * BONUS_DEPOSIT_PERCENT / 100);
                        }
                    } else {
                        amountActuallyReceived = Number(data.amount) + (Number(data.amount) * BONUS_DEPOSIT_PERCENT / 100);
                    }

                    user.coin += Number(amountActuallyReceived);
                    await user.save();
                    await user.reload();

                    const userJson = user.toJSON();
                    // const rechargeType = (data.chargeType == CHARGE_TYPE_ENUM.WALLET) ? "ví điện tử" : "ngân hàng";
                    const rechargeType = "ngân hàng";

                    // create balance fluctuation
                    await BalanceFluct.createBalaceFluct(
                        user.id,
                        BalanceFluct.BalanceFluctModel.ACTION_ENUM.DEPOSIT,
                        BalanceFluct.BalanceFluctModel.TYPE_ENUM.PLUS,
                        Number(amountActuallyReceived),
                        user.coin,
                        `Nạp tiền ${rechargeType} - Nạp ${Helper.numberWithCommas(Number(data.amount))} ${(isFirstDeposit) ? "- Thưởng nạp đầu " + Helper.numberWithCommas(FIRST_DEPOSIT_CONDITION.BONUS_EXP) : "- Tặng 0.0% " + Helper.numberWithCommas(Number(data.amount) * BONUS_DEPOSIT_PERCENT / 100)}% - cộng ${Helper.numberWithCommas(amountActuallyReceived)}`
                    );

                    const botTeleConfig = require('@Configs/telegram/bot.json');
                    const chatTeleConfig = require('@Configs/telegram/chatGroup.json');
                    const messageTeleConfig = require('@Configs/telegram/message.json');

                    // thông báo telegram
                    if (botTeleConfig.status) {
                        const time = moment().format("DD/MM/YYYY HH:MM:ss");
                        const username = userJson.username;
                        const name = userJson.name;
                        const phone = userJson.phone;
                        const email = userJson.email;
                        const amount = Helper.numberWithCommas(Number(data.amount));
                        const trans_id = requestId;
                        const chargeTypeProvide = record.bankProvide;
                        const chargeTypeProvideVi = rechargeType;

                        await teleBotSendMsg(chatTeleConfig.paymentBank, messageTeleConfig.paymentBank, {
                            '{{time}}': time,
                            '{{username}}': username,
                            '{{name}}': name,
                            '{{phone}}': phone,
                            '{{email}}': email,
                            '{{amount}}': amount,
                            '{{balance}}': Helper.numberWithCommas(user.coin),
                            '{{transId}}': trans_id,
                            '{{chargeTypeProvide}}': chargeTypeProvide,
                            '{{chargeTypeProvideVi}}': chargeTypeProvideVi
                        });
                    }

                    // push notify to admin
                    sse.emitData(sse.GROUP_ENUMS.ADMINS, "clients", {
                        type: "deposit",
                        data: {
                            userJson,
                            isFirst: isFirstDeposit,
                            amountActuallyReceived,
                            transaction: record
                        }
                    }, true, null);

                    // set withdraw condition
                    const userConditionWithdraw = await WithdrawConditionModel.findByUserId(record.uid);
                    if (userConditionWithdraw) {
                        userConditionWithdraw.totalMinimumBetAmount += Number(data.amount);
                        await userConditionWithdraw.save();
                        userConditionWithdraw.reload();
                    }
                    break;
                case 5:
                    record.status = BankHistoryModel.STATUS_ENUM.TIMEOUT;
                    break;
                case 4:
                    record.status = BankHistoryModel.STATUS_ENUM.ERROR;
                    break;
                default:
                    record.status = BankHistoryModel.STATUS_ENUM.ERROR;
                    break;
            }

            await record.save();
            await record.reload();

            return res.status(200).json({
                status: true,
                msg: RESPONSIVE_MESSAGE.SUCCESS
            });
        } catch (e) {
            console.log(e);
            return res.status(500).json({
                status: false,
                msg: RESPONSIVE_MESSAGE.SOMETHING_WENT_WRONG
            });
        }
    },
    RechargeTest: async (req, res, socket) => {
        try {
            const {
                uid
            } = req.query;
            const user = await UserModel.findOne({
                where: { id: uid },
                attributes: { exclude: ["password", "deletedAt", "code", "status", "role", "updatedAt"] },
            });

            let isFirstDeposit = false;

            // check order exitst by user
            const depositBank = await BankHistoryModel.findAll({
                where: {
                    uid: user.id,
                    type: BankHistoryModel.TYPE_ENUM.RECHARGE,
                    status: BankHistoryModel.STATUS_ENUM.SUCCESS,
                    is_first: BankHistoryModel.IS_FIRST.TRUE
                }
            });

            // if have deposit order else is first = true;
            if (depositBank.length == 0) isFirstDeposit = true;

            return res.status(200).json({
                status: true,
                msg: RESPONSIVE_MESSAGE.SUCCESS,
                depositBank: depositBank,
                isFirstDeposit
            });

        } catch (e) {
            console.log(e);
            return res.status(500).json({
                status: false,
                msg: RESPONSIVE_MESSAGE.SOMETHING_WENT_WRONG
            });
        }
    },
};
