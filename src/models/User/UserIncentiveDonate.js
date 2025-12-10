const sequelize = require("@Databases/mysql");
const { Model, DataTypes } = require("sequelize");

class UserIncentiveDonateModel extends Model {
    static scopes = {};
}

const defineEntitys = {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    admin_id: { type: DataTypes.INTEGER, allowNull: false }, // uid của quản trị viên tác động
    uid: { type: DataTypes.INTEGER, allowNull: false }, // uid của đối tác
    amount: { type: DataTypes.DECIMAL(19, 2), defaultValue: 0 },
    note: { type: DataTypes.STRING, allowNull: true, defaultValue: "" },
    description: { type: DataTypes.STRING, allowNull: true, defaultValue: "" },
    createdAt: { type: DataTypes.DATE },
    updatedAt: { type: DataTypes.DATE },
    deletedAt: { type: DataTypes.DATE },
};

UserIncentiveDonateModel.init(defineEntitys, {
    paranoid: true,
    tableName: "user_incentive_donates",
    updatedAt: "updatedAt",
    createdAt: "createdAt",
    deletedAt: "deletedAt",
    scopes: UserIncentiveDonateModel.scopes,
    sequelize,
});

UserIncentiveDonateModel.findByID = async (userId) => {
    const user = await UserIncentiveDonateModel.findOne({ where: { uid: userId } });
    if (user == null) {
        return null;
    } else {
        return user;
    }
};

module.exports = {
    UserIncentiveDonateEntitys: defineEntitys,
    UserIncentiveDonateModel
};