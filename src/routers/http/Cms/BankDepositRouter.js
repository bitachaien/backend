const { ERROR_PAGE } = require("@Helpers/contants");
const router = require("express").Router();
const middwarePerms = require("@Middwares/http/CmsPermission");
const BankDepositController = require("@HttpControllers/Cms/BankDepositController");

router.get("/", [middwarePerms(["view_app_bank_deposit_list"])], (req, res) => {
  BankDepositController.listBankDeposit(req, res);
});

router.post("/create", [middwarePerms(["create_app_bank_deposit"])], (req, res) => {
  BankDepositController.createBankDeposit(req, res);
});

router.get("/delete/:id", [middwarePerms(["delete_app_bank_deposit"])], (req, res) => {
  BankDepositController.deleteBankDeposit(req, res);
});
module.exports = router;
