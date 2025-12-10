const sequelize = require("@Databases/mysql");
const { Model, DataTypes } = require("sequelize");
const redis = require("@Databases/redis");

class ApiConfigModel extends Model {
    static IS_MAINTERNACE = {
        TRUE: true,
        FALSE: false
    };
    static scopes = {}
}

const defineParams = {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    is_mainternance: { type: DataTypes.BOOLEAN, defaultValue: ApiConfigModel.IS_MAINTERNACE.FALSE, defaultValue: false },
    api_name: { type: DataTypes.STRING, allowNull: false },
    api_product: { type: DataTypes.STRING, allowNull: true },
    api_config: {
        type: DataTypes.TEXT,
        get: function () {
            return JSON.parse(this.getDataValue("api_config"));
        },
        set: function (value) {
            return this.setDataValue("api_config", JSON.stringify(value));
        },
        allowNull: false
    },
    description: { type: DataTypes.STRING, allowNull: true },
    logo: { type: DataTypes.STRING, allowNull: true },
    createdAt: { type: DataTypes.DATE },
    updatedAt: { type: DataTypes.DATE },
    deletedAt: { type: DataTypes.DATE }
};

ApiConfigModel.init(defineParams, {
    paranoid: true,
    indexes: [{ unique: true, fields: ["api_name"] }],
    tableName: "api_configs",
    updatedAt: "updatedAt",
    createdAt: "createdAt",
    deletedAt: "deletedAt",
    scopes: ApiConfigModel.scopes,
    sequelize
});

ApiConfigModel.getApiConfigByName = async (api_name) => {
    const redisKey = "getApiConfigByName:" + api_name;
    const getRedis = await redis.get(redisKey);
    if (getRedis) return getRedis;
    const api = await ApiConfigModel.findOne({ where: { api_name } });
    redis.setex(redisKey, 15, api);
    return api;
}

module.exports = {
    ApiConfigModel
};