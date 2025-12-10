const {
    ERROR_PAGE,
    ERROR_FORM,
    ERROR_AUTH,
    ERROR_AUTH_MESSAGE,
    ERROR_MESSAGES,
    ERROR_SERVER,
    SUCCESS
} = require("@Helpers/contants");
const Helper = require("@Helpers/helpers");
const { VipModel } = require("@Models/Vip/Vip");
const { VipUpgradeModel } = require("@Models/Vip/VipUpgrade");
const { CardHistoryModel } = require("@Models/Card/CardHistory");
const { BankHistoryModel } = require("@Models/Bank/BankHistory");
const { BetHistoryModel } = require("@Models/Bet/BetHistory");
const vipConfig = require("@Configs/vip/vipReward.json");
const BalanceFluct = require("@Models/User/BalanceFluct");
const { UserModel } = require("@Models/User/User");

module.exports = {
    getVipConfig: (req, res) => {
        return res.status(200).json({
            status: true,
            data: vipConfig,
            msg: SUCCESS,
            code: 200
        });
    },
    getCurrentVip: async (req, res) => {
        try {
            const getUserVip = await VipModel.findOne({ where: { uid: req.user.id }, attributes: ["uid", "vip_current"] })

            if (!!getUserVip) {
                let vipData = {};

                if (getUserVip.vip_current == 0) {
                    vipData = {
                        "vip_current": 0,
                        "valid_bet_require": 0,
                        "deposit_require": 0,
                        "coin_reward": 0,
                        "coin_monthly": 0
                    };
                } else {
                    vipData = vipConfig["vip" + getUserVip.vip_current];
                    vipData.vip_current = getUserVip.vip_current;
                }

                let match = {};
                match.uid = req.user.id;
                match.status = BankHistoryModel.STATUS_ENUM.SUCCESS;
                match.type = BankHistoryModel.TYPE_ENUM.RECHARGE;
                const getUserDepositBank = await BankHistoryModel.findAll({
                    where: match,
                    attributes: ["amount"]
                });

                match.status = CardHistoryModel.STATUS_ENUM.SUCCESS;
                match.type = CardHistoryModel.TYPE_ENUM.RECHARGE;
                const getUserDepositCard = await BankHistoryModel.findAll({
                    where: match,
                    attributes: ["amount"]
                });

                vipData.total_deposit = 0;
                getUserDepositBank.forEach(deposit => vipData.total_deposit += deposit.amount);
                getUserDepositCard.forEach(deposit => vipData.total_deposit += deposit.amount);

                vipData.total_validBet = 0;
                const getBetHistory = await BetHistoryModel.findAll({
                    where: { uid: req.user.id },
                    attributes: ["validBetAmount"]
                });
                getBetHistory.forEach(bet => vipData.total_validBet += bet.validBetAmount);

                res.status(200).json({
                    status: true,
                    data: vipData,
                    msg: SUCCESS,
                    code: 200
                });
            } else {
                res.status(200).json({
                    status: false,
                    msg: ERROR_SERVER.WRONG,
                    code: 404
                });
            }
        } catch (e) {
            console.log(e);
            res.status(200).json({
                status: false,
                msg: e.message,
                code: 500
            });
        }
    },
    getVipReward: async (req, res) => {
        try {
            let { vip } = req.body;
            vip = vip >> 0;

            if (!vip) return res
                .status(200)
                .json({ status: false, msg: "Error Missing Param!" });

            const getUserVip = await VipModel.findOne({ where: { uid: req.user.id }, attributes: ["id", "uid", "vip_current"] })
            const user = await UserModel.findOne({ where: { id: req.user.id }, attributes: ["id", "coin"] });

            if (!!getUserVip && !!user) {
                let vipData = {};

                if (getUserVip.vip_current == 0) {
                    vipData = {
                        "vip_current": 0,
                        "valid_bet_require": 0,
                        "deposit_require": 0,
                        "coin_reward": 0,
                        "coin_monthly": 0
                    };
                } else {
                    vipData = vipConfig["vip" + getUserVip.vip_current];
                    vipData.vip_current = getUserVip.vip_current;
                }

                let match = {};
                match.uid = req.user.id;
                match.status = BankHistoryModel.STATUS_ENUM.SUCCESS;
                match.type = BankHistoryModel.TYPE_ENUM.RECHARGE;
                const getUserDepositBank = await BankHistoryModel.findAll({
                    where: match,
                    attributes: ["amount"]
                });

                match.status = CardHistoryModel.STATUS_ENUM.SUCCESS;
                match.type = CardHistoryModel.TYPE_ENUM.RECHARGE;
                const getUserDepositCard = await BankHistoryModel.findAll({
                    where: match,
                    attributes: ["amount"]
                });

                vipData.total_deposit = 0;
                getUserDepositBank.forEach(deposit => vipData.total_deposit += deposit.amount);
                getUserDepositCard.forEach(deposit => vipData.total_deposit += deposit.amount);

                vipData.total_validBet = 0;
                const getBetHistory = await BetHistoryModel.findAll({
                    where: { uid: req.user.id },
                    attributes: ["validBetAmount"]
                });
                getBetHistory.forEach(bet => vipData.total_validBet += bet.validBetAmount);

                const vipNext = vipConfig["vip" + vip];

                if (getUserVip.vip_current >= vip) return res.status(200).json({
                    status: false,
                    msg: "Bạn đã nhận thưởng này rồi!",
                    code: 401
                });

                if (
                    vipData.total_deposit >= vipNext.deposit_require &&
                    vipData.total_validBet >= vipNext.valid_bet_require
                ) {
                    getUserVip.vip_current = vip;
                    await getUserVip.save();
                    getUserVip.reload();
                    user.coin += vipNext.coin_reward;
                    await user.save();
                    user.reload();

                    await VipUpgradeModel.create({
                        uid: user.id,
                        from: vipData.vip_current,
                        to: vip,
                        coin_reward: vipNext.coin_reward,
                        coin_monthly: vipNext.coin_monthly
                    });

                    // create balance fluctuation
                    await BalanceFluct.createBalaceFluct(
                        getUserVip.uid,
                        BalanceFluct.BalanceFluctModel.ACTION_ENUM.VIP_UPGRADE,
                        BalanceFluct.BalanceFluctModel.TYPE_ENUM.PLUS,
                        Number(vipNext.coin_reward),
                        user.coin,
                        `Nhận thưởng thăng cấp VIP ${vip} - cộng ${Helper.numberWithCommas(vipNext.coin_reward)}`
                    );

                    return res.status(200).json({
                        status: true,
                        data: vipData,
                        msg: "Nhận thưởng thăng cấp thành công!",
                        code: 200
                    });
                } else {
                    return res.status(200).json({
                        status: false,
                        msg: "Không đủ điều kiện để nhận thưởng thăng cấp!",
                        code: 401
                    });
                }
            } else {
                return res.status(200).json({
                    status: false,
                    msg: "Không tìm thấy dữ liệu!",
                    code: 404
                });
            }
        } catch (e) {
            console.log(e);
            res.status(200).json({
                status: false,
                msg: e.message,
                code: 500
            });
        }
    },
};