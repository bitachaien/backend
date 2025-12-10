const sequelize = require("@Databases/mysql");
const { Model, DataTypes } = require("sequelize");
const redis = require("@Databases/redis");

class ApiProductConfigModel extends Model {
    static IS_MAINTERNACE = {
        TRUE: true,
        FALSE: false
    };
    static scopes = {}
}

const defineParams = {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    is_mainternance: { type: DataTypes.BOOLEAN, defaultValue: ApiProductConfigModel.IS_MAINTERNACE.FALSE, defaultValue: false },
    product_api: { type: DataTypes.STRING, allowNull: false },
    product_name: { type: DataTypes.STRING, allowNull: false },
    product_code: { type: DataTypes.STRING, allowNull: false },
    product_type: { type: DataTypes.STRING, allowNull: false },
    product_mode: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    description: { type: DataTypes.STRING, allowNull: true },
    logo: { type: DataTypes.STRING, allowNull: true },
    thumbnail: { type: DataTypes.STRING, allowNull: true },
    icon: { type: DataTypes.STRING, allowNull: true },
    createdAt: { type: DataTypes.DATE },
    updatedAt: { type: DataTypes.DATE },
    deletedAt: { type: DataTypes.DATE }
};

ApiProductConfigModel.init(defineParams, {
    paranoid: true,
    indexes: [
        { unique: true, fields: ["product_name"] },
        { unique: true, fields: ["product_code"] },
        { unique: true, fields: ["product_type"] }
    ],
    tableName: "api_product_configs",
    updatedAt: "updatedAt",
    createdAt: "createdAt",
    deletedAt: "deletedAt",
    scopes: ApiProductConfigModel.scopes,
    sequelize
});

ApiProductConfigModel.getProductByCode = async (product_code) => {
    const redisKey = "getProductByCode:" + product_code;
    const getRedis = await redis.get(redisKey);
    if (getRedis) return getRedis;
    const product = await ApiProductConfigModel.findOne({ where: { product_code } });
    redis.setex(redisKey, 15, product);
    return product;
}

ApiProductConfigModel.getProductByType = async (product_type) => {
    const redisKey = "getProductByType:" + product_type;
    const getRedis = await redis.get(redisKey);
    if (getRedis) return getRedis;
    const product = await ApiProductConfigModel.findOne({ where: { product_type } });
    redis.setex(redisKey, 15, product);
    return product;
}

ApiProductConfigModel.getAllProductCode = async (match = {}) => {
    const redisKey = "getAllProductCode";
    const getRedis = await redis.get(redisKey);
    if (getRedis) return getRedis;
    let listProduct = await ApiProductConfigModel.findAll({
        attributes: ['product_code'],
        group: ['product_code'],
        where: match
    });
    listProduct = listProduct.map(product => product.product_code);
    redis.setex(redisKey, 60, listProduct);
    return listProduct;
}

module.exports = {
    ApiProductConfigModel
};