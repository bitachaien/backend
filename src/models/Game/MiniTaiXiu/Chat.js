const sequelize = require("@Databases/mysql");
const { Model, DataTypes } = require("sequelize");

class MiniTaixiuChatModel extends Model {
    static IS_BOT = {
        TRUE: true,
        FALSE: false
    };
    static scopes = {}
}

const defineParams = {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    is_bot: { type: DataTypes.BOOLEAN, defaultValue: MiniTaixiuChatModel.IS_BOT.FALSE, defaultValue: false },
    uid: { type: DataTypes.INTEGER, allowNull: false },
    message: { type: DataTypes.STRING, allowNull: false },
    createdAt: { type: DataTypes.DATE },
    updatedAt: { type: DataTypes.DATE },
    deletedAt: { type: DataTypes.DATE }
};

// DataTypes.DECIMAL(19, 2)
MiniTaixiuChatModel.init(defineParams, {
    paranoid: true,
    indexes: [],
    tableName: "mini_taixiu_chat",
    updatedAt: "updatedAt",
    createdAt: "createdAt",
    deletedAt: "deletedAt",
    scopes: MiniTaixiuChatModel.scopes,
    sequelize
});

module.exports = {
    MiniTaixiuChatModel
};