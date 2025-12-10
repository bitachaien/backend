const moment = require("moment-timezone");
moment.tz.setDefault("Asia/Ho_Chi_Minh");
const { Op } = require("sequelize");
// const Sequelize = require("sequelize");
const { BetHistoryModel } = require("../../models/Bet/BetHistory");
const handle = require("./handle");

module.exports = async () => {
    try {
        const currentTime = moment.tz('Asia/Ho_Chi_Minh');
        const timeTo = currentTime;
        const timeToStr = timeTo.format("YYYY-MM-DD HH:mm:ss");

        // Lấy tất cả các cược trong ngày hôm nay (từ 0h đến hiện tại)
        // Logic trong handle.js sẽ tự động chỉ tính các cược chưa được tính
        const todayStart = currentTime.clone().startOf('day');
        const timeFromStr = todayStart.format("YYYY-MM-DD HH:mm:ss");

        console.log(`[BetRefund] Processing refunds from ${timeFromStr} to ${timeToStr}`);

        let match = {};
        match.betTime = { [Op.between]: [timeFromStr, timeToStr] }

        const getBetRecord = await BetHistoryModel.findAll({
            where: match,
            attributes: {
                exclude: ['updatedAt', 'deletedAt']
            },
            order: [["id", "ASC"]],
        });

        console.log(`[BetRefund] Found ${getBetRecord.length} bet records today`);

        if (getBetRecord.length === 0) {
            console.log(`[BetRefund] No bets to process`);
            return;
        }

        let objRecord = {};
        getBetRecord.forEach(record => { objRecord[record.username] = []; });
        getBetRecord.forEach(record => { objRecord[record.username].push(record); });
        
        for (var username in objRecord) {
            if (objRecord.hasOwnProperty(username)) {
                await handle(username, objRecord[username], timeFromStr, timeToStr);
            }
        }
    } catch (err) {
        console.error('[BetRefund] Error:', err);
    }
}