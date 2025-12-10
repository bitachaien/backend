const sequelize = require("@Databases/mysql");
const { Model, DataTypes } = require("sequelize");

class MiniTaixiuUserModel extends Model {
  static IS_BOT = {
    TRUE: true,
    FALSE: false
  };
  static scopes = {  };
}

const defineParams = {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  uid: { type: DataTypes.INTEGER, primaryKey: true, allowNull: false },
  username: { type: DataTypes.STRING, allowNull: false },
  is_bot: { type: DataTypes.BOOLEAN, defaultValue: MiniTaixiuUserModel.IS_BOT.FALSE, defaultValue: false },
  total_bet: { type: DataTypes.DECIMAL(19, 2), allowNull: false, defaultValue: 0 },
  total_win: { type: DataTypes.DECIMAL(19, 2), allowNull: false, defaultValue: 0 },
  total_win_log: {
    type: DataTypes.DECIMAL(19, 2), allowNull: false, defaultValue: 0,
    comment: 'log for the top of the game, will be reset to 0 every 00:00'
  },
  total_lose: { type: DataTypes.DECIMAL(19, 2), allowNull: false, defaultValue: 0 },
  total_refurn: { type: DataTypes.DECIMAL(19, 2), allowNull: false, defaultValue: 0 },
  createdAt: { type: DataTypes.DATE },
  updatedAt: { type: DataTypes.DATE },
  deletedAt: { type: DataTypes.DATE }
};


MiniTaixiuUserModel.init(defineParams, {
  paranoid: true,
  indexes: [{ unique: true, fields: ["uid"] }],
  tableName: "mini_taixiu_users",
  updatedAt: "updatedAt",
  createdAt: "createdAt",
  deletedAt: "deletedAt",
  scopes: MiniTaixiuUserModel.scopes,
  sequelize
});

module.exports = {
  MiniTaixiuUserModel
};