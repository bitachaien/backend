const sequelize = require('@Databases/mysql');
const { Model, DataTypes } = require("sequelize");
const md5 = require("md5");

class AdminPasswdSecurityModel extends Model {
    static scopes = {}
}

const defineParams = {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    uid: { type: DataTypes.INTEGER, allowNull: false },
    password: {
        type: DataTypes.STRING,
        set: function (value) {
            return this.setDataValue("password", md5(value));
        },
        allowNull: false
    },
    createdAt: { type: DataTypes.DATE },
    updatedAt: { type: DataTypes.DATE },
    deletedAt: { type: DataTypes.DATE },
}

AdminPasswdSecurityModel.init(defineParams, {
    paranoid: true,
    tableName: "admin_password_securitys",
    updatedAt: "updatedAt",
    createdAt: "createdAt",
    deletedAt: "deletedAt",
    scopes: AdminPasswdSecurityModel.scopes,
    sequelize,
});

AdminPasswdSecurityModel.findPasswdByUserId = async (uid) => {
    return await AdminPasswdSecurityModel.findOne({ where: { uid } });
};

module.exports = {
    AdminPasswdSecurityModel
};