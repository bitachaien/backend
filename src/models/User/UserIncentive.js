const sequelize = require("@Databases/mysql");
const { Model, DataTypes } = require("sequelize");

class UserIncentiveModel extends Model {
    static TYPE_ENUM = {
        DEPOSIT: "deposit", // nạp tiền vào
        WITHDRAW: "withdraw", // rút tiền ra
        GIFTCODE: "giftcode", // mã giftcode
        BET_REFURN: "bet-refurn", // hoàn trả
        VIP_UPGRADE: "vip-upgrade", // nhận thưởng thăng cấp vip
        BALANCE_UPDATE: "balance-update", // cập nhật số dư trong cms
    };
    static scopes = {};
}

const defineEntitys = {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    uid: { type: DataTypes.INTEGER, allowNull: false }, // uid của đối tác
    type: {
        type: DataTypes.ENUM({ values: Object.values(UserIncentiveModel.TYPE_ENUM) })
    },
    amount: { type: DataTypes.DECIMAL(19, 2), defaultValue: 0 },
    description: { type: DataTypes.STRING, allowNull: true, defaultValue: "" },
    createdAt: { type: DataTypes.DATE },
    updatedAt: { type: DataTypes.DATE },
    deletedAt: { type: DataTypes.DATE },
};

UserIncentiveModel.init(defineEntitys, {
    paranoid: true,
    tableName: "user_incentives",
    updatedAt: "updatedAt",
    createdAt: "createdAt",
    deletedAt: "deletedAt",
    scopes: UserIncentiveModel.scopes,
    sequelize,
});

UserIncentiveModel.findByID = async (userId) => {
    const user = await UserIncentiveModel.findOne({ where: { uid: userId } });
    if (user == null) {
        return null;
    } else {
        return user;
    }
};

module.exports = {
    UserIncentiveEntitys: defineEntitys,
    UserIncentiveModel
};