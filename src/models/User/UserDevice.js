const sequelize = require("@Databases/mysql");
const { Model, DataTypes } = require("sequelize");
const UserMod = require("@Models/User/User");

class UserDeviceModel extends Model {
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
    ip: { type: DataTypes.STRING, allowNull: true, defaultValue: "" },
    user_agent: { type: DataTypes.STRING, allowNull: true, defaultValue: "" },
    location: { type: DataTypes.STRING, allowNull: true, defaultValue: "" },
    last_login: { type: DataTypes.DATE, allowNull: false },
    createdAt: { type: DataTypes.DATE },
    updatedAt: { type: DataTypes.DATE },
    deletedAt: { type: DataTypes.DATE },
};

UserDeviceModel.init(defineEntitys, {
    paranoid: true,
    tableName: "user_devices",
    updatedAt: "updatedAt",
    createdAt: "createdAt",
    deletedAt: "deletedAt",
    scopes: UserDeviceModel.scopes,
    sequelize,
});

UserDeviceModel.findByID = async (userId) => {
    const user = await UserDeviceModel.findOne({ where: { uid: userId } });
    if (user == null) {
        return null;
    } else {
        return user;
    }
};

module.exports = {
    UserDeviceEntitys: defineEntitys,
    UserDeviceModel
};