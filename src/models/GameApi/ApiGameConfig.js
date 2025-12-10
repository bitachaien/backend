const sequelize = require("@Databases/mysql");
const { Model, DataTypes } = require("sequelize");
const redis = require("@Databases/redis");

class ApiGameConfigModel extends Model {
    static IS_MAINTERNACE = {
        TRUE: true,
        FALSE: false
    };
    static GAME_TYPE = {
        RNG: "RNG", // slot nổ hũ
        FISH: "FISH",  // bắn cá
        PVP: "PVP", // chess game bài
        LIVE: "LIVE", // live game
        SPORTS: "SPORTS", // Sports thể thao
        ESPORTS: "ESPORTS", // ESPORTS thể thao điện tử
        COCKFIGHT: "COCKFIGHT",   // Đá gà
        ELOTTO: "ELOTTO" // xổ số
    };
    static IS_HOT = {
        TRUE: true,
        FALSE: false
    };

    static scopes = {}
}

const defineParams = {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    is_mainternance: { type: DataTypes.BOOLEAN, defaultValue: ApiGameConfigModel.IS_MAINTERNACE.FALSE, defaultValue: false },
    product_type: { type: DataTypes.STRING, allowNull: false },
    product_code: { type: DataTypes.STRING, allowNull: false },
    game_type: {
        type: DataTypes.ENUM({ values: Object.values(ApiGameConfigModel.GAME_TYPE) }),
        allowNull: false
    },
    game_code: { type: DataTypes.STRING, allowNull: false },
    game_name: { type: DataTypes.STRING, allowNull: false },
    game_icon: { type: DataTypes.STRING, allowNull: false },
    game_trial_support: { type: DataTypes.BOOLEAN, defaultValue: false },
    is_hot: { type: DataTypes.BOOLEAN, defaultValue: ApiGameConfigModel.IS_HOT.FALSE, defaultValue: false },
    play_count: { type: DataTypes.INTEGER, defaultValue: 0 },
    description: { type: DataTypes.STRING, allowNull: true },
    createdAt: { type: DataTypes.DATE },
    updatedAt: { type: DataTypes.DATE },
    deletedAt: { type: DataTypes.DATE }
};

ApiGameConfigModel.init(defineParams, {
    paranoid: true,
    indexes: [
        { unique: true, fields: ["game_code"] },
    ],
    tableName: "api_game_configs",
    updatedAt: "updatedAt",
    createdAt: "createdAt",
    deletedAt: "deletedAt",
    scopes: ApiGameConfigModel.scopes,
    sequelize
});

ApiGameConfigModel.getGameByCode = async (game_code) => {
    const redisKey = "getGameByCode:" + game_code;
    const getRedis = await redis.get(redisKey);
    if (getRedis) return getRedis;
    const product = await ApiGameConfigModel.findOne({ where: { game_code } });
    redis.setex(redisKey, 15, product);
    return product;
}

module.exports = {
    ApiGameConfigModel
};