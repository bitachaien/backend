const { ERROR_PAGE } = require("@Helpers/contants");
const router = require("express").Router();
const middwarePerms = require("@Middwares/http/CmsPermission");
const DepositController = require("@HttpControllers/Cms/DepositController");

router.get("/", [middwarePerms(["view_app_deposit_bank_list"])], (req, res) => {
  DepositController.listDeposit(req, res);
});

router.get("/delete/:id", [middwarePerms(["delete_app_deposit_bank"])], (req, res) => {
  DepositController.deleteDeposit(req, res);
});

router.get("/deposit-info/:id", [middwarePerms(["view_app_deposit_bank_info"])], (req, res) => {
  DepositController.depositInfo(req, res);
});

router.post("/update/:id", [middwarePerms(["update_app_deposit_bank"])], (req, res) => {
  DepositController.Action.update(req, res);
});

module.exports = router;
