const sequelize = require("@Databases/mysql");
const { Model, DataTypes } = require("sequelize");

class BetRefurnModel extends Model {
  static STATUS_ENUM = {
    SUCCESS: "success",
    PENDING: "pending",
    CLAIMED: "claimed",
    ERROR: "error",
    WIN: "win",
    LOSE: "lose",
    HIT_CANCEL: "hit_cancel",
    PLAYER_CANCEL: "player_cancel",
    DRAW_CANCEL: "draw_cancel",
    SYSTEM_DRAWBACK: "system_drawback",
    TIE: "tie",
    BO_DRAWBACK: "bo_drawback"
  }
}

const defineParams = {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  uid: { type: DataTypes.INTEGER, allowNull: false },
  username: { type: DataTypes.STRING, allowNull: true },
  betAmount: { type: DataTypes.DECIMAL(19,2), allowNull: true },
  validBetAmount: { type: DataTypes.DECIMAL(19,2), allowNull: true },
  winAmount: { type: DataTypes.DECIMAL(19,2), allowNull: true },
  netPnl: { type: DataTypes.DECIMAL(19,2), allowNull: true },
  percentReturn: { type: DataTypes.DECIMAL(10,2), allowNull: true },
  amountReturn: { type: DataTypes.DECIMAL(19,2), allowNull: true },
  currency: { type: DataTypes.STRING, allowNull: true },
  gameCategory: { type: DataTypes.STRING, allowNull: true },
  status: {
    type: DataTypes.ENUM({ values: Object.values(BetRefurnModel.STATUS_ENUM) }),
    allowNull: false,
    defaultValue: BetRefurnModel.STATUS_ENUM.PENDING
  },
  timeFrom: { type: DataTypes.DATE },
  timeTo: { type: DataTypes.DATE },
  createdAt: { type: DataTypes.DATE },
  updatedAt: { type: DataTypes.DATE },
  deletedAt: { type: DataTypes.DATE },
};

BetRefurnModel.init(defineParams, {
  paranoid: true,
  indexes: [],
  tableName: "bet_refurns",
  updatedAt: "updatedAt",
  createdAt: "createdAt",
  deletedAt: "deletedAt",
  sequelize
});

module.exports = {
    BetRefurnModel
};
