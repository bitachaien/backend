const sequelize = require('@Databases/mysql');
const { Model, DataTypes } = require("sequelize");

class CardHistoryModel extends Model {
    static TYPE_ENUM = {
        RECHARGE: "recharge",
        CASHOUT: "cashout",
    };
    static STATUS_ENUM = {
        SUCCESS: "success",
        PENDING: "pending",
        ERROR: "error",
    };
    static IS_FIRST = {
        TRUE: true,
        FALSE: false
    };
}

const defineParams = {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    uid: { type: DataTypes.INTEGER, allowNull: false },
    transId: { type: DataTypes.STRING, allowNull: false },
    type: {
        type: DataTypes.ENUM({ values: Object.values(CardHistoryModel.TYPE_ENUM) }),
        allowNull: false
    },
    amount: { type: DataTypes.DECIMAL(19, 2), defaultValue: 0 },
    network: { type: DataTypes.STRING, allowNull: false },
    pin: { type: DataTypes.STRING, allowNull: false },
    seri: { type: DataTypes.STRING, allowNull: false },
    info: { type: DataTypes.STRING, allowNull: true, defaultValue: '' },
    status: {
        type: DataTypes.ENUM({ values: Object.values(CardHistoryModel.STATUS_ENUM) }),
        defaultValue: CardHistoryModel.STATUS_ENUM.PENDING,
    },
    is_first: {
        type: DataTypes.BOOLEAN,
        defaultValue: CardHistoryModel.IS_FIRST.FALSE,
        defaultValue: false
    },
    createdAt: { type: DataTypes.DATE },
    updatedAt: { type: DataTypes.DATE },
    deletedAt: { type: DataTypes.DATE },
}

CardHistoryModel.init(defineParams, {
    paranoid: true,
    tableName: "card_histories",
    updatedAt: "updatedAt",
    createdAt: "createdAt",
    deletedAt: "deletedAt",
    sequelize,
});

module.exports = {
    CardHistoryModel
};