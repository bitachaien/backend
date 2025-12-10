const { ERROR_PAGE } = require("@Helpers/contants");
const router = require("express").Router();
const middwarePerms = require("@Middwares/http/CmsPermission");
const WithdrawController = require("@HttpControllers/Cms/WithdrawController");

router.get("/", [middwarePerms(["view_app_withdraw_list"])], (req, res) => {
  WithdrawController.listWithdraw(req, res);
});

router.get("/delete/:id", [middwarePerms(["delete_app_withdraw_list"])], (req, res) => {
  WithdrawController.deleteWithdraw(req, res);
});

router.get("/withdraw-info/:id", [middwarePerms(["view_app_withdraw_info"])], (req, res) => {
  WithdrawController.withdrawInfo(req, res);
});

router.post("/update/:id", [middwarePerms(["update_app_withdraw_info"])], (req, res) => {
  WithdrawController.Action.update(req, res);
});

module.exports = router;
