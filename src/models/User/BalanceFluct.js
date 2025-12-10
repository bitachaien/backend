const sequelize = require("@Databases/mysql");
const { Model, DataTypes } = require("sequelize");
const UserMod = require("@Models/User/User");

class BalanceFluctModel extends Model {
    static ACTION_ENUM = {
        DEPOSIT: "deposit", // nạp tiền vào
        WITHDRAW: "withdraw", // rút tiền ra
        TRANSFER_WALLET: "transfer-wallet", // chuyển ví
        BET_REFURN: "bet-refurn", // hoàn trả
        VIP_UPGRADE: "vip-upgrade", // nhận thưởng thăng cấp vip
        BALANCE_UPDATE: "balance-update", // cập nhật số dư trong cms
        REFURN: "refund", // hoàn tiền (vd: hủy lệnh rút),
        BET_GAME: "bet-game", // đặt cược trò chơi (vd: tài xỉu xóc đĩa)
        BET_RESULT: "bet-result", // kết quả đặt cược trò chơi (vd: tài xỉu xóc đĩa)
    };
    static TYPE_ENUM = {
        PLUS: "plus", // cộng
        MINUS: "minus", // trừ
        BALANCE: "balance", // không giao động
    };
    static scopes = {
        withUserInfo() {
            return {
                include: [
                    {
                        model: UserMod.UserModel,
                        as: "user_info",
                        attributes: { exclude: ["password", "deletedAt", "code", "role", "updatedAt"] }
                    }
                ]
            };
        },
        byUsername(username) {
            return {
                include: [
                    {
                        model: UserMod.UserModel,
                        where: { username },
                        as: "user_info",
                        attributes: { exclude: ["password", "deletedAt", "code", "role", "updatedAt"] },
                    }
                ]
            };
        }
    };
}

const defineEntitys = {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    uid: { type: DataTypes.INTEGER, allowNull: false }, // uid của đối tác
    action: { // kiểu giao dịch ( nạp vào hoặc rút ra )
        type: DataTypes.ENUM({ values: Object.values(BalanceFluctModel.ACTION_ENUM) }),
        allowNull: false
    },
    type: { // kiểu giao động (cộng hoặc trừ)
        type: DataTypes.ENUM({ values: Object.values(BalanceFluctModel.TYPE_ENUM) }),
        allowNull: false
    },
    amount: { type: DataTypes.DECIMAL(19, 2), defaultValue: 0 }, // số tiền của giao động
    balance: { type: DataTypes.DECIMAL(19, 2), defaultValue: 0 }, // số dư sau giao dịch
    note: { // ghi chú thêm
        type: DataTypes.TEXT("long"),
        allowNull: true,
    },
    createdAt: { type: DataTypes.DATE },
    updatedAt: { type: DataTypes.DATE },
    deletedAt: { type: DataTypes.DATE },
};

BalanceFluctModel.init(defineEntitys, {
    paranoid: true,
    tableName: "balance_fluct",
    updatedAt: "updatedAt",
    createdAt: "createdAt",
    deletedAt: "deletedAt",
    scopes: BalanceFluctModel.scopes,
    sequelize,
});

const createBalaceFluct = async (
    uid = null,
    action = null,
    type = null,
    amount = null,
    balance = null,
    note = "") => {
    try {
        if (uid == null || action == null || type == null || amount == null || balance == null) {
            console.log("Error create BalanceFluct: Missing parameter");
            return;
        }
        return await BalanceFluctModel.create({
            uid, action, type, amount, balance, note
        });
    } catch (e) {
        console.log(e);
        return;
    }
};

module.exports = {
    BalanceFluctEntitys: defineEntitys,
    BalanceFluctModel,
    createBalaceFluct
};