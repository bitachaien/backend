const sequelize = require("@Databases/mysql");
const { Model, DataTypes } = require("sequelize");

class MiniTaixiuSessionModel extends Model {
    static COMPLETED_ENUM = {
        TRUE: true,
        FALSE: false
    };
    static scopes = {}
}

const defineParams = {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    result: {
        type: DataTypes.TEXT,
        get: function () {
            return JSON.parse(this.getDataValue("result"));
        },
        set: function (value) {
            return this.setDataValue("result", JSON.stringify(value));
        },
        allowNull: false
    },
    total_bet: { type: DataTypes.DECIMAL(19, 2), allowNull: false, defaultValue: 0 },
    total_win: { type: DataTypes.DECIMAL(19, 2), allowNull: false, defaultValue: 0 },
    total_lose: { type: DataTypes.DECIMAL(19, 2), allowNull: false, defaultValue: 0 },
    total_refurn: { type: DataTypes.DECIMAL(19, 2), allowNull: false, defaultValue: 0 },
    completed: {
        type: DataTypes.BOOLEAN,
        defaultValue: MiniTaixiuSessionModel.COMPLETED_ENUM.FALSE
    },
    createdAt: { type: DataTypes.DATE },
    updatedAt: { type: DataTypes.DATE },
    deletedAt: { type: DataTypes.DATE }
};

MiniTaixiuSessionModel.init(defineParams, {
    paranoid: true,
    indexes: [],
    tableName: "mini_taixiu_session",
    updatedAt: "updatedAt",
    createdAt: "createdAt",
    deletedAt: "deletedAt",
    scopes: MiniTaixiuSessionModel.scopes,
    sequelize
});

MiniTaixiuSessionModel.getLastSession = async () => {
    return await MiniTaixiuSessionModel.findOne({
        order: [["id", "DESC"]],
        limit: 1
    });
}


module.exports = {
    MiniTaixiuSessionModel
};
