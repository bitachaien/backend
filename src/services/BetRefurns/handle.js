const Helper = require("@Helpers/helpers");
const { BetRefurnModel } = require("../../models/Bet/BetRefurn");
const { BetHistoryModel } = require("../../models/Bet/BetHistory");
const BetRefurnConfig = require("@Configs/game/betRefurn.json");
const { UserModel, findByUsername, findByEmail, findByPhoneNumber } = require("@Models/User/User");
const BalanceFluct = require("@Models/User/BalanceFluct");
const { WithdrawConditionModel } = require("@Models/Withdraw/WithdrawCondition");
const { Op } = require("sequelize");


const GAME_CATEGORY_TEXT_ENUM = {
    "RNG": "Nổ Hũ",
    "FISH": "Bắn Cá",
    "PVP": "Game Bài",
    "LIVE": "Casino",
    "SPORTS": "Thể Thao",
    "ESPORTS": "Thể Thao Điện Tử",
    "COCKFIGHT": "Đá Gà",
    "ELOTTO": "Xổ Số"
};

module.exports = async function (username, data, timeFrom, timeTo) {
    // console.log(data);
    const rcGameCategory = {
        "RNG": [],
        "FISH": [],
        "PVP": [],
        "LIVE": [],
        "SPORTS": [],
        "ESPORTS": [],
        "COCKFIGHT": [],
        "ELOTTO": []
    };
    data.forEach(record => {
        if (record.gameCategory != null && record.gameCategory) {
            rcGameCategory[record.gameCategory.toUpperCase()].push(record);
        }
    });


    for (var gameCategory in rcGameCategory) {
        if (rcGameCategory.hasOwnProperty(gameCategory)) {
            const user = await UserModel.findOne({ where: { username } });
            if (!user) {
                console.log(`[BetRefund] User not found: ${username}`);
                continue;
            }

            const startOfDay = new Date(timeTo);
            startOfDay.setHours(0, 0, 0, 0);
            const formatDateTime = (dateObj) => dateObj.toISOString().slice(0, 19).replace('T', ' ');

            // Tìm bản ghi hoàn trả PENDING cuối cùng để biết thời điểm tính cuối cùng
            const lastPendingRefund = await BetRefurnModel.findOne({
                where: {
                    uid: user.id,
                    gameCategory: gameCategory,
                    status: BetRefurnModel.STATUS_ENUM.PENDING
                },
                order: [['createdAt', 'DESC']]
            });

            // Tìm bản ghi hoàn trả CLAIMED cuối cùng để biết các cược đã được tính
            const lastClaimedRefund = await BetRefurnModel.findOne({
                where: {
                    uid: user.id,
                    gameCategory: gameCategory,
                    status: BetRefurnModel.STATUS_ENUM.CLAIMED
                },
                order: [['createdAt', 'DESC']]
            });

            // Thời điểm bắt đầu cho bản ghi mới (nếu cần tạo)
            let baseStartTime = startOfDay;
            if (lastClaimedRefund && lastClaimedRefund.timeTo) {
                const claimedTime = new Date(lastClaimedRefund.timeTo);
                if (claimedTime > baseStartTime) {
                    baseStartTime = claimedTime;
                }
            }

            // Thời điểm bắt đầu để lấy thêm cược mới (nếu đã có bản ghi pending thì tiếp tục sau timeTo của bản ghi đó)
            let fetchStartTime = baseStartTime;
            if (lastPendingRefund && lastPendingRefund.timeTo) {
                const pendingTime = new Date(lastPendingRefund.timeTo);
                if (pendingTime > fetchStartTime) {
                    fetchStartTime = pendingTime;
                }
            }

            const recordStartTimeStr = (lastPendingRefund && lastPendingRefund.timeFrom)
                ? formatDateTime(new Date(lastPendingRefund.timeFrom))
                : formatDateTime(baseStartTime);

            const fetchStartTimeStr = formatDateTime(new Date(fetchStartTime.getTime() + 1000));
            
            // Lọc các cược từ data parameter chưa được tính (sau fetchStartTimeStr)
            const newBetsFromData = rcGameCategory[gameCategory].filter(record => {
                const betTime = new Date(record.betTime);
                const fetchTime = new Date(fetchStartTimeStr);
                return betTime > fetchTime;
            });

            // Tính tổng các cược mới từ data
            let totalValidBetNew = 0;
            let totalBetNew = 0;
            let totalWinNew = 0;
            let totalNetPnlNew = 0;
            
            newBetsFromData.forEach(bet => {
                const validBet = parseFloat(bet.validBetAmount || 0);
                const betAmount = parseFloat(bet.betAmount || 0);
                const winAmount = parseFloat(bet.winAmount || 0);
                const netPnl = parseFloat(bet.netPnl || 0);
                
                // Kiểm tra xem giá trị có bị chia cho 1000 không
                // Nếu validBetAmount nhỏ hơn 1000 nhưng betOrderNo tồn tại, có thể đã bị chia
                // Nhưng để an toàn, chỉ nhân lại nếu giá trị quá nhỏ (ví dụ < 100)
                if (validBet > 0 && validBet < 100 && bet.betOrderNo) {
                    // Có thể giá trị đã bị chia cho 1000, nhưng không chắc chắn
                    // Nên không tự động nhân lại ở đây
                }
                
                totalValidBetNew += validBet;
                totalBetNew += betAmount;
                totalWinNew += winAmount;
                totalNetPnlNew += netPnl;
            });

            console.log(`[BetRefund] ${username} - ${gameCategory}: totalValidBetNew = ${totalValidBetNew}, newBetsFromData count = ${newBetsFromData.length}`);

            if (totalValidBetNew >= 1) {
                // Nếu có bản ghi PENDING, cộng thêm vào tổng hiện có
                let totalValidBetAll = totalValidBetNew;
                let totalBetAll = totalBetNew;
                let totalWinAll = totalWinNew;
                let totalNetPnlAll = totalNetPnlNew;

                if (lastPendingRefund) {
                    const pendingValidBet = parseFloat(lastPendingRefund.validBetAmount || 0);
                    totalValidBetAll += pendingValidBet;
                    totalBetAll += parseFloat(lastPendingRefund.betAmount || 0);
                    totalWinAll += parseFloat(lastPendingRefund.winAmount || 0);
                    totalNetPnlAll += parseFloat(lastPendingRefund.netPnl || 0);
                    console.log(`[BetRefund] ${username} - ${gameCategory}: Adding pending refund: validBet = ${pendingValidBet}, totalValidBetAll = ${totalValidBetAll}`);
                }

                // Tính lại phần trăm hoàn trả dựa trên tổng cược hợp lệ
                let percentReturnAll = 0;
                if (totalValidBetAll >= 100000000) {
                    percentReturnAll = BetRefurnConfig.BET_100000000[gameCategory];
                } else if (totalValidBetAll >= 50000000) {
                    percentReturnAll = BetRefurnConfig.BET_50000000[gameCategory];
                } else if (totalValidBetAll >= 10000000) {
                    percentReturnAll = BetRefurnConfig.BET_10000000[gameCategory];
                } else if (totalValidBetAll >= 5000000) {
                    percentReturnAll = BetRefurnConfig.BET_5000000[gameCategory];
                } else if (totalValidBetAll >= 1000000) {
                    percentReturnAll = BetRefurnConfig.BET_1000000[gameCategory];
                } else {
                    percentReturnAll = BetRefurnConfig.BET_LESS_1000000[gameCategory];
                }

                let amountReturnAll = (totalValidBetAll / 100) * percentReturnAll;
                
                console.log(`[BetRefund] ${username} - ${gameCategory}: totalValidBetAll = ${totalValidBetAll}, percentReturn = ${percentReturnAll}%, amountReturnAll = ${amountReturnAll}`);

                // Kiểm tra xem totalValidBetAll có bị chia cho 1000 không
                // Nếu totalValidBetAll nhỏ hơn 1000 nhưng amountReturnAll cũng quá nhỏ so với tỷ lệ phần trăm
                // thì có thể dữ liệu đã bị chia cho 1000
                if (totalValidBetAll > 0 && totalValidBetAll < 1000 && amountReturnAll < totalValidBetAll * 0.01) {
                    // Có thể dữ liệu đã bị chia cho 1000, nhân lại
                    const correctedValidBet = totalValidBetAll * 1000;
                    const correctedAmountReturn = (correctedValidBet / 100) * percentReturnAll;
                    
                    // Kiểm tra xem giá trị sau khi nhân 1000 có hợp lý không
                    if (correctedValidBet >= 1000 && correctedAmountReturn >= correctedValidBet * 0.001) {
                        console.log(`[BetRefund] Detected values divided by 1000. Correcting: totalValidBetAll ${totalValidBetAll} -> ${correctedValidBet}, amountReturnAll ${amountReturnAll} -> ${correctedAmountReturn}`);
                        totalValidBetAll = correctedValidBet;
                        totalBetAll = totalBetAll * 1000;
                        totalWinAll = totalWinAll * 1000;
                        totalNetPnlAll = totalNetPnlAll * 1000;
                        amountReturnAll = correctedAmountReturn;
                    }
                }

                if (lastPendingRefund) {
                    // Cập nhật bản ghi hoàn trả hiện có với tổng mới
                    lastPendingRefund.betAmount = totalBetAll;
                    lastPendingRefund.validBetAmount = totalValidBetAll;
                    lastPendingRefund.winAmount = totalWinAll;
                    lastPendingRefund.netPnl = totalNetPnlAll;
                    lastPendingRefund.percentReturn = percentReturnAll;
                    lastPendingRefund.amountReturn = amountReturnAll;
                    lastPendingRefund.timeTo = timeTo;
                    await lastPendingRefund.save();
                    console.log(`[BetRefund] Updated refund for ${username} - ${gameCategory}: amountReturn = ${amountReturnAll}, validBetAmount = ${totalValidBetAll} (added ${totalValidBetNew} new validBet)`);
                } else {
                    // Tạo bản ghi hoàn trả mới với status PENDING - chờ user nhận
                    await BetRefurnModel.create({
                        uid: user.id,
                        username: username,
                        betAmount: totalBetAll,
                        validBetAmount: totalValidBetAll,
                        winAmount: totalWinAll,
                        netPnl: totalNetPnlAll,
                        percentReturn: percentReturnAll,
                        amountReturn: amountReturnAll,
                        currency: "VN",
                        gameCategory,
                        status: BetRefurnModel.STATUS_ENUM.PENDING,
                        timeFrom: recordStartTimeStr,
                        timeTo: timeTo
                    });
                    console.log(`[BetRefund] Created new refund for ${username} - ${gameCategory}: amountReturn = ${amountReturnAll}, validBetAmount = ${totalValidBetAll}`);
                }
            } else if (lastPendingRefund) {
                // Không có cược mới nhưng vẫn cập nhật timeTo
                lastPendingRefund.timeTo = timeTo;
                await lastPendingRefund.save();
            }
            // Không tự động cộng tiền vào số dư - user phải thao tác nhận
        }
    }
};