const { ERROR_PAGE } = require("@Helpers/contants");
const router = require("express").Router();
const middwarePerms = require("@Middwares/http/CmsPermission");
const UserController = require("@HttpControllers/Cms/UserController");

router.get("/", [middwarePerms(["view_app_user_list"])], (req, res) => {
  UserController.listUser(req, res);
});

router.get("/list-username", (req, res) => {
  UserController.listUsername(req, res);
});

router.get("/user-info/:id", [middwarePerms(["view_app_user_info"])], (req, res) => {
  UserController.userInfo(req, res);
});

router.get("/user-profit/:id", [middwarePerms(["view_app_user_profit"])], (req, res) => {
  UserController.userProfit(req, res);
});

router.get("/balance-fluct/:id", [middwarePerms(["view_app_user_balance_fluct"])], (req, res) => {
  UserController.BalanceFluction(req, res);
});

router.get("/delete/:id", [middwarePerms(["delete_app_user"])], (req, res) => {
  UserController.deleteUser(req, res);
});

router.post("/update/:id", [middwarePerms(["update_app_user_info"])], (req, res) => {
  UserController.Action.update(req, res);
});

router.post("/change-password/:id", [middwarePerms(["change_password_app_user"])], (req, res) => {
  UserController.Action.changePassword(req, res);
});

router.get("/getListUserBank/:id", [middwarePerms(["get_list_bank_app_user"])], (req, res) => {
  UserController.getListUserBank(req, res);
});

router.post("/updateBankUser/:id", [middwarePerms(["update_list_bank_app_user"])], (req, res) => {
  UserController.updateBankUser(req, res);
});

router.post("/deleteBankUser/:id", [middwarePerms(["delete_list_bank_app_user"])], (req, res) => {
  UserController.deleteBankUser(req, res);
});

router.get("/send-otp-update-balance/:id", (req, res) => {
  UserController.Action.sendOtpUpdateBalance(req, res);
});

router.post("/update-user-balance/:id", [middwarePerms(["update_app_user_balance"])], (req, res) => {
  UserController.Action.updateBalance(req, res);
});

router.post("/create-user-incentive-donate/:id", [middwarePerms(["create_app_user_incentive_donate"])], (req, res) => {
  UserController.Action.createIncentiveDonate(req, res);
});

module.exports = router;
