const sequelize = require("@Databases/mysql");
const { Model, DataTypes } = require("sequelize");

class IpRegModel extends Model {
    static scopes = {
    };
}

const defineEntitys = {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    uid: { type: DataTypes.INTEGER, allowNull: false }, // uid của đối tác
    ip: { type: DataTypes.STRING, allowNull: true, defaultValue: "" },
    createdAt: { type: DataTypes.DATE },
    updatedAt: { type: DataTypes.DATE },
    deletedAt: { type: DataTypes.DATE },
};

IpRegModel.init(defineEntitys, {
    paranoid: true,
    indexes: [],
    tableName: "ip_registereds",
    updatedAt: "updatedAt",
    createdAt: "createdAt",
    deletedAt: "deletedAt",
    scopes: IpRegModel.scopes,
    sequelize
  });

module.exports = {
    IpRegModel
};