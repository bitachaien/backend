const moment = require("moment-timezone");
moment.tz.setDefault("Asia/Ho_Chi_Minh");
const { Op } = require("sequelize");
const {
    ERROR_PAGE,
    ERROR_FORM,
    ERROR_AUTH,
    ERROR_AUTH_MESSAGE,
    ERROR_MESSAGES,
    SUCCESS
} = require("@Helpers/contants");
const { UserModel } = require("@Models/User/User");
const { AgencyModel } = require("@Models/Agency/Agency");
const { AgencyRefModel } = require("@Models/Agency/AgencyRef");
const { CardHistoryModel } = require("@Models/Card/CardHistory");
const { BankHistoryModel } = require("@Models/Bank/BankHistory");
const { BetHistoryModel } = require("@Models/Bet/BetHistory");
const { BetRefurnModel } = require("@Models/Bet/BetRefurn");
const { UserIncentiveModel } = require("@Models/User/UserIncentive");
const { UserIncentiveDonateModel } = require("@Models/User/UserIncentiveDonate");

const createDatesObject = (startDate, endDate) => {
    const start = moment(startDate);
    const end = moment(endDate);
    const result = {};
    while (start <= end) {
        const formattedDate = start.format('DD-MM-YYYY');
        result[formattedDate] = 0;
        start.add(1, 'days');
    }
    return result;
}

module.exports = {
    index: async (req, res) => {
        try {
            return res.status(200).json({
                status: true,
                msg: SUCCESS,
                code: 200
            });
        } catch (e) {
            console.log(e);
            return res.status(200).json({
                status: false,
                msg: e.message,
                code: 500
            });
        }
    },
    Statis: async (req, res) => {
        try {
            let { from, to } = req.query;
            let timeStart, timeEnd;
            if (!!from && !!to) {
                timeStart = moment(from, "DD/MM/YYYY").startOf('day');
                timeEnd = moment(to, "DD/MM/YYYY").endOf('day');
            } else {
                timeStart = moment().startOf('day');
                timeEnd = moment().endOf('day');
            }

            let
                totalDeposit = 0,
                totalWithdraw = 0,
                totalVolumeBet = 0,
                totalProfit = 0,
                totalPlayProfit = 0,
                totalNewDeposit = 0,
                totalReDeposit = 0,
                totalRefurn = 0,
                totalIncentive = 0,
                totalIncentiveDonate = 0,
                totalNewUserReg = 0;

            async function getCardHistory() {
                const cardRecord = await CardHistoryModel.findAll({
                    where: {
                        createdAt: {
                            [Op.between]: [timeStart.format(), timeEnd.format()]
                        },
                        status: CardHistoryModel.STATUS_ENUM.SUCCESS
                    },
                    attributes: ['amount', 'createdAt'],
                });
                cardRecord.forEach((data) => {
                    totalDeposit += Number(data.amount);
                });
                return true;
            }

            async function getBankHistory() {
                const bankRecord = await BankHistoryModel.findAll({
                    where: {
                        createdAt: {
                            [Op.between]: [timeStart.format(), timeEnd.format()]
                        },
                        status: BankHistoryModel.STATUS_ENUM.SUCCESS
                    },
                    attributes: ['amount', 'type', 'createdAt', 'is_first'],
                });
                bankRecord.forEach((data) => {
                    if (data.type == BankHistoryModel.TYPE_ENUM.RECHARGE) {
                        totalDeposit += Number(data.amount);
                        (data.is_first == BankHistoryModel.IS_FIRST.TRUE) ? totalNewDeposit++ : totalReDeposit++;
                    } else if (data.type == BankHistoryModel.TYPE_ENUM.CASHOUT) {
                        totalWithdraw += Number(data.amount);
                    }
                });
                return true;
            }

            async function getBetHistory() {
                const betRecord = await BetHistoryModel.findAll({
                    where: {
                        createdAt: {
                            [Op.between]: [timeStart.format(), timeEnd.format()]
                        }
                    },
                    attributes: ['betAmount', 'netPnl', 'validBetAmount'],
                });
                betRecord.forEach((data) => {
                    totalVolumeBet += Number(data.validBetAmount * 1000);
                    totalPlayProfit += Number(data.netPnl * 1000);
                });
                return true;
            }

            async function getBetRefurnHistory() {
                const betRefurn = await BetRefurnModel.findAll({
                    where: {
                        createdAt: {
                            [Op.between]: [timeStart.format(), timeEnd.format()]
                        }
                    },
                    attributes: ['amountReturn'],
                });
                betRefurn.forEach((data) => {
                    totalRefurn += Number(data.amountReturn);
                });
                return true;
            }

            async function getIncentive() {
                const getIncentive = await UserIncentiveModel.findAll({
                    where: {
                        createdAt: {
                            [Op.between]: [timeStart.format(), timeEnd.format()]
                        }
                    },
                });
                getIncentive.forEach((data) => {
                    totalIncentive += Number(data.amount);
                });
                return true;
            }

            async function getIncentiveDonate() {
                const getIncentiveDonate = await UserIncentiveDonateModel.findAll({
                    where: {
                        createdAt: {
                            [Op.between]: [timeStart.format(), timeEnd.format()]
                        }
                    },
                });
                getIncentiveDonate.forEach((data) => {
                    totalIncentiveDonate += Number(data.amount);
                });
                return true;
            }

            async function getUserRegister() {
                const getUser = await UserModel.findAll({
                    where: {
                        createdAt: {
                            [Op.between]: [timeStart.format(), timeEnd.format()]
                        }
                    },
                    attributes: ['createdAt'],
                });

                getUser.forEach((data) => {
                    totalNewUserReg++;
                });
                return true;
            }

            await Promise.all([
                getCardHistory(),
                getBankHistory(),
                getBetHistory(),
                getBetRefurnHistory(),
                getIncentive(),
                getIncentiveDonate(),
                getUserRegister()
            ]).then((success) => {
                totalProfit = totalDeposit - totalWithdraw - totalIncentive - totalRefurn;

                return res.status(200).json({
                    status: true,
                    data: {
                        totalDeposit,
                        totalWithdraw,
                        totalProfit,
                        totalVolumeBet,
                        totalPlayProfit,
                        totalRefurn,
                        totalIncentive,
                        totalIncentiveDonate,
                        totalNewDeposit,
                        totalReDeposit,
                        totalNewUserReg
                    },
                    msg: SUCCESS,
                    code: 200
                });
            }).catch((err) => {
                console.log(err);
                return res.status(200).json({
                    status: false,
                    msg: err,
                    code: 500
                });
            });
        } catch (e) {
            console.log(e);
            return res.status(200).json({
                status: false,
                msg: e.message,
                code: 500
            });
        }
    },
    ChartStatis: async (req, res) => {
        try {
            let { from, to } = req.query;
            let timeStart, timeEnd;
            if (!!from && !!to) {
                timeStart = moment(from, "DD/MM/YYYY").startOf('day');
                timeEnd = moment(to, "DD/MM/YYYY").endOf('day');
            } else {
                timeStart = moment().startOf('day');
                timeEnd = moment().endOf('day');
            }

            let
                totalDeposit = 0,
                totalWithdraw = 0,
                totalVolumeBet = 0,
                totalProfit = 0,
                totalPlayProfit = 0,
                totalNewDeposit = 0,
                totalRefurn = 0,
                totalIncentive = 0;


            let dataDateFinan = createDatesObject(moment(from, "DD/MM/YYYY"), moment(to, "DD/MM/YYYY").endOf('day'));

            async function getCardHistory() {
                const cardRecord = await CardHistoryModel.findAll({
                    where: {
                        createdAt: {
                            [Op.between]: [timeStart.format(), timeEnd.format()]
                        },
                        type: CardHistoryModel.TYPE_ENUM.RECHARGE,
                        status: CardHistoryModel.STATUS_ENUM.SUCCESS
                    },
                    attributes: ['amount', 'createdAt'],
                });

                cardRecord.forEach((data) => {
                    totalDeposit += Number(data.amount);
                    dataDateFinan[moment(data.createdAt).format('DD-MM-YYYY')] += Number(data.amount);
                });
                return dataDateFinan;
            }

            async function getBankHistory() {
                const bankRecord = await BankHistoryModel.findAll({
                    where: {
                        createdAt: {
                            [Op.between]: [timeStart.format(), timeEnd.format()]
                        },
                        status: BankHistoryModel.STATUS_ENUM.SUCCESS
                    },
                    attributes: ['amount', 'type', 'createdAt', 'is_first'],
                });

                let dataDate = {
                    newFirstDeposit: createDatesObject(moment(from, "DD/MM/YYYY"), moment(to, "DD/MM/YYYY").endOf('day')),
                    withdraw: createDatesObject(moment(from, "DD/MM/YYYY"), moment(to, "DD/MM/YYYY").endOf('day')),
                };

                bankRecord.forEach((data) => {
                    if (data.type == BankHistoryModel.TYPE_ENUM.RECHARGE) {
                        totalDeposit += Number(data.amount);
                        if (data.is_first == BankHistoryModel.IS_FIRST.TRUE) {
                            totalNewDeposit++;
                            dataDate.newFirstDeposit[moment(data.createdAt).format('DD-MM-YYYY')]++;
                        };
                        dataDateFinan[moment(data.createdAt).format('DD-MM-YYYY')] += Number(data.amount);
                    } else if (data.type == BankHistoryModel.TYPE_ENUM.CASHOUT) {
                        totalWithdraw += Number(data.amount);
                        dataDate.withdraw[moment(data.createdAt).format('DD-MM-YYYY')] += Number(data.amount);
                    }
                });
                return dataDate;
            }

            async function getBetHistory() {
                const betRecord = await BetHistoryModel.findAll({
                    where: {
                        createdAt: {
                            [Op.between]: [timeStart.format(), timeEnd.format()]
                        }
                    },
                    attributes: ['betAmount', 'netPnl', 'validBetAmount', 'createdAt'],
                });

                let dataDate = createDatesObject(moment(from, "DD/MM/YYYY"), moment(to, "DD/MM/YYYY").endOf('day'));

                betRecord.forEach((data) => {
                    totalVolumeBet += Number(data.validBetAmount * 1000);
                    totalPlayProfit += Number(data.netPnl * 1000);
                    dataDate[moment(data.createdAt).format('DD-MM-YYYY')] += Number(data.validBetAmount);
                });
                return dataDate;
            }

            async function getBetRefurnHistory() {
                const betRefurn = await BetRefurnModel.findAll({
                    where: {
                        createdAt: {
                            [Op.between]: [timeStart.format(), timeEnd.format()]
                        }
                    },
                    attributes: ['amountReturn', 'createdAt'],
                });

                let dataDate = createDatesObject(moment(from, "DD/MM/YYYY"), moment(to, "DD/MM/YYYY").endOf('day'));

                betRefurn.forEach((data) => {
                    totalRefurn += Number(data.amountReturn);
                    dataDate[moment(data.createdAt).format('DD-MM-YYYY')] += Number(data.amountReturn);
                });
                return dataDate;
            }

            async function getIncentive() {
                const getIncentive = await UserIncentiveModel.findAll({
                    where: {
                        createdAt: {
                            [Op.between]: [timeStart.format(), timeEnd.format()]
                        }
                    },
                    attributes: ['amount', 'createdAt'],
                });

                let dataDate = createDatesObject(moment(from, "DD/MM/YYYY"), moment(to, "DD/MM/YYYY").endOf('day'));

                getIncentive.forEach((data) => {
                    totalIncentive += Number(data.amount);
                    dataDate[moment(data.createdAt).format('DD-MM-YYYY')] += Number(data.amount);
                });
                return dataDate;
            }

            async function getUserRegister() {
                const getUser = await UserModel.findAll({
                    where: {
                        createdAt: {
                            [Op.between]: [timeStart.format(), timeEnd.format()]
                        }
                    },
                    attributes: ['createdAt'],
                });

                let dataDate = createDatesObject(moment(from, "DD/MM/YYYY"), moment(to, "DD/MM/YYYY").endOf('day'));

                getUser.forEach((data) => {
                    dataDate[moment(data.createdAt).format('DD-MM-YYYY')]++;
                });
                return dataDate;
            }

            await Promise.all([
                getCardHistory(),
                getBankHistory(),
                getBetHistory(),
                getBetRefurnHistory(),
                getIncentive(),
                getUserRegister()
            ]).then((value) => {
                totalProfit = totalDeposit - totalWithdraw - totalIncentive - totalRefurn;

                const [
                    cardHistory,
                    bankHistory,
                    betHistory,
                    betRefurnHistory,
                    incentiveHistory,
                    userRegister
                ] = value;

                let dataExport = {
                    total: {
                        totalDeposit,
                        totalWithdraw,
                        totalProfit,
                        totalVolumeBet,
                        totalPlayProfit,
                        totalRefurn,
                        totalIncentive,
                        totalNewDeposit
                    },
                    chart: {
                        deposit: dataDateFinan,
                        newFirstDeposit: bankHistory.newFirstDeposit,
                        withdraw: bankHistory.withdraw,
                        validBet: betHistory,
                        betRefurn: betRefurnHistory,
                        incentive: incentiveHistory,
                        newUserReg: userRegister
                    }
                };

                return res.status(200).json({
                    status: true,
                    data: dataExport,
                    msg: SUCCESS,
                    code: 200
                });
            }).catch((err) => {
                console.log(err);
                return res.status(200).json({
                    status: false,
                    msg: err,
                    code: 500
                });
            });
        } catch (e) {
            console.log(e);
            return res.status(200).json({
                status: false,
                msg: e.message,
                code: 500
            });
        }
    },
    Calculate: async (req, res) => {
        try {
            const totalSystemUser = await UserModel.count();
            const totalSystemUserIsAgency = await UserModel.count({ where: { role: UserModel.ROLE_ENUM.AGENCY } });
            const totalSystemUserRegisterByAgency = await AgencyRefModel.count();

            return res.status(200).json({
                status: true,
                data: {
                    totalSystemUser,
                    totalSystemUserIsAgency,
                    totalSystemUserRegisterByAgency
                },
                msg: SUCCESS,
                code: 200
            });
        } catch (e) {
            console.log(e);
            return res.json({
                status: false,
                msg: e.message,
                code: 500
            });
        }
    },
    SumBalance: async (req, res) => {
        try {
            let totalCoin = 0;
            const getUser = await UserModel.findAll({
                where: { role: { [Op.or]: [UserModel.ROLE_ENUM.USER, UserModel.ROLE_ENUM.AGENCY] } },
                attributes: ["coin"]
            });
            getUser.forEach((user) => totalCoin += user.coin);
            return res.status(200).json({
                status: true,
                totalCoin,
                msg: SUCCESS,
                code: 200
            });
        } catch (e) {
            console.log(e);
            return res.json({
                status: false,
                msg: e.message,
                code: 500
            });
        }
    }
};
