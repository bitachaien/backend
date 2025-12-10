const sequelize = require("@Databases/mysql");

const { ConfigModel } = require("./Configs/Configs");

const { ApiConfigModel } = require("./GameApi/ApiConfig");
const { ApiGameConfigModel } = require("./GameApi/ApiGameConfig");
const { ApiProductConfigModel } = require("./GameApi/ApiProductConfig");

const { AdminAccountModel } = require("@Models/Admin/AdminAccount");
const { AdminPermModel } = require("@Models/Admin/AdminPermission");
const { AdminPasswdSecurityModel } = require("@Models/Admin/AdminPasswdSecurity");

const { UserModel } = require("./User/User");
const { UserDeviceModel } = require("./User/UserDevice");
const { UserIncentiveModel } = require("./User/UserIncentive");
const { UserIncentiveDonateModel } = require("./User/UserIncentiveDonate");
const { IpRegModel } = require("./User/IpRegistered");
const { BankHistoryModel } = require("./Bank/BankHistory");
const { BankUserModel } = require("./Bank/BankUser");
const { MessageModel } = require("./Message/Message");
const { BetHistoryModel } = require("./Bet/BetHistory");
const BetRefurnModel = require("./Bet/BetRefurn").BetRefurnModel;
const { CardHistoryModel } = require("./Card/CardHistory");
const { AgencyModel } = require("./Agency/Agency");
const { AgencyRefModel } = require("./Agency/AgencyRef");
const { VipModel } = require("./Vip/Vip");
const { VipUpgradeModel } = require("./Vip/VipUpgrade");
const { PromotionModel } = require("./Promotion/Promotion");
const { PromotionRegisterModel } = require("./Promotion/PromotionRegister");
const { PasswdSecurityModel } = require("./Security/PasswdSecurity");
const { WithdrawConditionModel } = require("./Withdraw/WithdrawCondition");

const { MiniTaixiuUserModel } = require("./Game/MiniTaiXiu/User");
const { MiniTaixiuSessionModel } = require("./Game/MiniTaiXiu/Session");
const { MiniTaixiuBetOrderModel } = require("./Game/MiniTaiXiu/BetOrder");
const { MiniTaixiuChatModel } = require("./Game/MiniTaiXiu/Chat");

const { XocXocUserModel } = require("./Game/XocXoc/User");
const { XocXocSessionModel } = require("./Game/XocXoc/Session");
const { XocXocBetOrderModel } = require("./Game/XocXoc/BetOrder");

const { BalanceFluctModel } = require("./User/BalanceFluct");


// Call Init Models 
ConfigModel;

// admin
AdminPermModel.belongsTo(AdminAccountModel, {
  as: "account_info",
  foreignKey: "uid"
});

AdminAccountModel.hasMany(AdminPermModel, {
  as: "account_permission",
  foreignKey: "uid"
});

AdminPasswdSecurityModel.belongsTo(AdminAccountModel, {
  as: "account_info",
  foreignKey: "uid"
});


BankHistoryModel.belongsTo(UserModel, {
  as: "userInfo",
  foreignKey: "uid"
});

UserModel.hasMany(BankHistoryModel, {
  as: "bankHistory",
  foreignKey: "id"
});

CardHistoryModel.belongsTo(UserModel, {
  as: "userInfo",
  foreignKey: "uid"
});

UserModel.hasMany(CardHistoryModel, {
  as: "cardHistory",
  foreignKey: "id"
});

BankUserModel.belongsTo(UserModel, {
  as: "userInfo",
  foreignKey: "id"
});

UserModel.hasMany(BankUserModel, {
  as: "BankUser",
  foreignKey: "uid"
});

MessageModel.belongsTo(UserModel, {
  as: "userInfo",
  foreignKey: "uid"
});

UserModel.hasMany(MessageModel, {
  as: "Message",
  foreignKey: "id"
});

BetHistoryModel.belongsTo(UserModel, {
  as: "userInfo",
  foreignKey: "uid"
});

UserModel.hasMany(BetHistoryModel, {
  as: "BetHistory",
  foreignKey: "uid"
});

AgencyModel.belongsTo(UserModel, {
  as: "userInfo",
  foreignKey: "uid"
});

UserModel.hasOne(AgencyModel, {
  as: "AgencyInfo",
  foreignKey: "uid"
});

AgencyRefModel.belongsTo(UserModel, {
  as: "userInfo",
  foreignKey: "uid"
});

UserModel.hasOne(AgencyRefModel, {
  as: "AgencyRefInfo",
  foreignKey: "id"
});

AgencyRefModel.belongsTo(AgencyModel, {
  as: "AgencyInfo",
  foreignKey: "agency"
});

AgencyModel.hasOne(AgencyRefModel, {
  as: "AgencyReferer",
  foreignKey: "id"
});

UserModel.hasMany(VipModel, {
  as: "VipInfo",
  foreignKey: "uid"
});

VipModel.belongsTo(UserModel, {
  as: "userInfo",
  foreignKey: "uid"
});

UserModel.hasMany(VipUpgradeModel, {
  as: "VipUpgradeInfo",
  foreignKey: "uid"
});

VipUpgradeModel.belongsTo(UserModel, {
  as: "userInfo",
  foreignKey: "uid"
});

UserModel.hasMany(PromotionRegisterModel, {
  as: "userRegiserPromotionInfo",
  foreignKey: "uid"
});


PromotionRegisterModel.belongsTo(UserModel, {
  as: "userInfo",
  foreignKey: "uid"
});

PromotionModel.hasMany(PromotionRegisterModel, {
  as: "promotionRegisterInfo",
  foreignKey: "promotion"
});

PromotionRegisterModel.belongsTo(PromotionModel, {
  as: "promotionInfo",
  foreignKey: "uid"
});

PasswdSecurityModel.belongsTo(UserModel, {
  as: "userInfo",
  foreignKey: "uid"
});

UserModel.hasMany(WithdrawConditionModel, {
  as: "WithdrawConditionInfo",
  foreignKey: "uid"
});

WithdrawConditionModel.belongsTo(UserModel, {
  as: "userInfo",
  foreignKey: "uid"
});

UserModel.hasMany(PromotionRegisterModel, {
  as: "PasswordSecurityInfo",
  foreignKey: "uid"
});

BetRefurnModel.belongsTo(UserModel, {
  as: "userInfo",
  foreignKey: "uid"
});

UserModel.hasMany(BetRefurnModel, {
  as: "BetRefurn",
  foreignKey: "uid"
});


MiniTaixiuSessionModel.hasMany(MiniTaixiuBetOrderModel, {
  as: "session_bet_order",
  foreignKey: "session"
});


MiniTaixiuBetOrderModel.belongsTo(MiniTaixiuSessionModel, {
  as: "session_info",
  foreignKey: "session"
});

MiniTaixiuBetOrderModel.belongsTo(UserModel, {
  as: "user_info",
  foreignKey: "uid"
});

XocXocSessionModel.hasMany(XocXocBetOrderModel, {
  as: "session_bet_order",
  foreignKey: "session"
});


XocXocBetOrderModel.belongsTo(XocXocSessionModel, {
  as: "session_info",
  foreignKey: "session"
});

XocXocBetOrderModel.belongsTo(UserModel, {
  as: "user_info",
  foreignKey: "uid"
});



MiniTaixiuUserModel.belongsTo(UserModel, {
  as: "user_info",
  foreignKey: "uid"
});

XocXocUserModel.belongsTo(UserModel, {
  as: "user_info",
  foreignKey: "uid"
});

MiniTaixiuChatModel.belongsTo(UserModel, {
  as: "user_info",
  foreignKey: "uid"
});

BalanceFluctModel.belongsTo(UserModel, {
  as: "user_info",
  foreignKey: "uid"
});

UserModel.hasMany(BalanceFluctModel, {
  as: "balance_fluct",
  foreignKey: "uid"
});

IpRegModel.belongsTo(UserModel, {
  as: "user_info",
  foreignKey: "uid"
});

UserModel.hasMany(IpRegModel, {
  as: "ip_registered",
  foreignKey: "uid"
});

UserDeviceModel.belongsTo(UserModel, {
  as: "user_info",
  foreignKey: "uid"
});

UserModel.hasMany(UserDeviceModel, {
  as: "user_device",
  foreignKey: "uid"
});

UserIncentiveModel.belongsTo(UserModel, {
  as: "user_info",
  foreignKey: "uid"
});

UserModel.hasMany(UserIncentiveModel, {
  as: "user_incentive",
  foreignKey: "uid"
});


UserIncentiveDonateModel.belongsTo(UserModel, {
  as: "user_info",
  foreignKey: "uid"
});

UserModel.hasMany(UserIncentiveModel, {
  as: "user_incentive_donate",
  foreignKey: "uid"
});

const InitializeConnection = sequelize.sync({ alter: true, logging: false });

module.exports = InitializeConnection;