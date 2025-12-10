const sequelize = require("@Databases/mysql");
const { Model, DataTypes } = require("sequelize");

class AdminPermModel extends Model {
  static scopes = {}
}

const defineParams = {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  uid: { type: DataTypes.INTEGER, allowNull: false },
  position: { type: DataTypes.STRING, allowNull: false },
  allow: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  createdAt: { type: DataTypes.DATE },
  updatedAt: { type: DataTypes.DATE },
  deletedAt: { type: DataTypes.DATE }
};

AdminPermModel.init(defineParams, {
  paranoid: true,
  indexes: [{ unique: true, fields: ["uid", "position"] }],
  tableName: "admin_permissions",
  updatedAt: "updatedAt",
  createdAt: "createdAt",
  deletedAt: "deletedAt",
  scopes: AdminPermModel.scopes,
  sequelize
});


const findAllByUID = async (userId) => {
  const user = await AdminPermModel.findAll({
    where: { uid: userId }
  });
  if (user == null) {
    return null;
  } else {
    return user;
  }
};

const findPerm = async (userId, position) => {
  const user = await AdminPermModel.findAll({
    where: { uid: userId, position }
  });
  if (user == null) {
    return null;
  } else {
    return user;
  }
};

module.exports = {
  findAllByUID,
  findPerm,
  AdminPermModel
};