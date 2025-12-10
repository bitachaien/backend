const sequelize = require("@Databases/mysql");
const { Model, DataTypes } = require("sequelize");

class XocXocBetOrderModel extends Model {
    static IS_BOT = {
        TRUE: true,
        FALSE: false
    };
    static BET_TYPE_ENUM = {
        TAI: true,
        XIU: false
    };
    static PAID_ENUM = {
        TRUE: true,
        FALSE: false
    };
    static IS_WIN_ENUM = {
        TRUE: true,
        FALSE: false
    };
    static scopes = {}
}

const defineParams = {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    is_bot: { type: DataTypes.BOOLEAN, defaultValue: XocXocBetOrderModel.IS_BOT.FALSE, defaultValue: false },
    session: { type: DataTypes.INTEGER, allowNull: false },
    uid: { type: DataTypes.INTEGER, allowNull: false },

    even: { type: DataTypes.DECIMAL(19, 2), allowNull: false, defaultValue: 0 },
    odd: { type: DataTypes.DECIMAL(19, 2), allowNull: false, defaultValue: 0 },
    red3: { type: DataTypes.DECIMAL(19, 2), allowNull: false, defaultValue: 0 },
    red4: { type: DataTypes.DECIMAL(19, 2), allowNull: false, defaultValue: 0 },
    white3: { type: DataTypes.DECIMAL(19, 2), allowNull: false, defaultValue: 0 },
    white4: { type: DataTypes.DECIMAL(19, 2), allowNull: false, defaultValue: 0 },

    total_win: { type: DataTypes.DECIMAL(19, 2), allowNull: false, defaultValue: 0 },
    total_lose: { type: DataTypes.DECIMAL(19, 2), allowNull: false, defaultValue: 0 },
    total_refurn: { type: DataTypes.DECIMAL(19, 2), allowNull: false, defaultValue: 0 },
    is_win: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: XocXocBetOrderModel.IS_WIN_ENUM.FALSE },
    paid: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: XocXocBetOrderModel.PAID_ENUM.FALSE },
    createdAt: { type: DataTypes.DATE },
    updatedAt: { type: DataTypes.DATE },
    deletedAt: { type: DataTypes.DATE }
};

XocXocBetOrderModel.init(defineParams, {
    paranoid: true,
    indexes: [],
    tableName: "xocxoc_bet_order",
    updatedAt: "updatedAt",
    createdAt: "createdAt",
    deletedAt: "deletedAt",
    scopes: XocXocBetOrderModel.scopes,
    sequelize
});

module.exports = {
    XocXocBetOrderModel
};