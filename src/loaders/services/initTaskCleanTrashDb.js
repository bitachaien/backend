const moment = require("moment-timezone");
moment.tz.setDefault("Asia/Ho_Chi_Minh");
const { UserModel } = require("@Models/User/User");
const BalanceFluct = require("@Models/User/BalanceFluct");
// const { MiniTaixiuSessionModel } = require("@Models/Game/MiniTaiXiu/Session");
const { MiniTaixiuBetOrderModel } = require("@Models/Game/MiniTaiXiu/BetOrder");
const { MiniTaixiuChatModel } = require("@Models/Game/MiniTaiXiu/Chat");

// const { XocXocSessionModel } = require("@Models/Game/XocXoc/Session");
const { XocXocBetOrderModel } = require("@Models/Game/XocXoc/BetOrder");


module.exports = async () => {

    setInterval(async () => {
        try {
            const timeCheck = moment.tz('Asia/Ho_Chi_Minh').format("HH:mm");
            // if (timeCheck == "00:00") {
            const getUsers = await UserModel.findAll({
                where: { is_bot: UserModel.IS_BOT.TRUE },
                attributes: ["id"]
            });
            const listIsBotId = getUsers.map((user) => user.id);

            // clean Balance Fluctions
            const cleanBalanceFluct = new Promise(async (resolve, reject) => {
                const records = await BalanceFluct.BalanceFluctModel.findAll({
                    where: { uid: listIsBotId },
                    order: [["id", "ASC"]]
                });
                const cleanId = records.map((record) => record.id);
                resolve((cleanId.length > 0) ? await BalanceFluct.BalanceFluctModel.destroy({ where: { id: cleanId }, force: true }) : 0);
            });

            // clean TaiXiu Chat
            const cleanTxChat = new Promise(async (resolve, reject) => {
                const records = await MiniTaixiuChatModel.findAll({
                    where: { uid: listIsBotId },
                    order: [["id", "DESC"]],
                    offset: 100
                });
                const cleanId = records.map((record) => record.id);
                resolve((cleanId.length > 0) ? await MiniTaixiuChatModel.destroy({ where: { id: cleanId }, force: true }) : 0);
            });

            // clean TaiXiu Bet Order
            const cleanTxBetOrder = new Promise(async (resolve, reject) => {
                const records = await MiniTaixiuBetOrderModel.findAll({
                    where: { uid: listIsBotId },
                    order: [["id", "DESC"]],
                    offset: 5000
                });
                const cleanId = records.map((record) => record.id);
                resolve((cleanId.length > 0) ? await MiniTaixiuBetOrderModel.destroy({ where: { id: cleanId }, force: true }) : 0);
            });

            // clean XocXoc Bet Order
            const cleanXocXocBetOrder = new Promise(async (resolve, reject) => {
                const records = await XocXocBetOrderModel.findAll({
                    where: { uid: listIsBotId },
                    order: [["id", "DESC"]],
                    offset: 5000
                });
                const cleanId = records.map((record) => record.id);
                resolve((cleanId.length > 0) ? await XocXocBetOrderModel.destroy({ where: { id: cleanId }, force: true }) : 0);
            });

            Promise.allSettled([
                cleanBalanceFluct,
                cleanTxChat,
                cleanTxBetOrder,
                cleanXocXocBetOrder
            ]).then((results) => {
                console.log("BalanceFluct cleaned count: " + results[0].value);
                console.log("TaiXiuChat cleaned count: " + results[1].value);
                console.log("TaiXiuBetOrder cleaned count: " + results[2].value);
                console.log("XocXocBetOrder cleaned count: " + results[3].value);
            });
            // }
        } catch (err) {
            console.log(err);
        }
    }, 30000 * 60);  //  1 houre
};