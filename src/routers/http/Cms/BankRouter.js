const { ERROR_PAGE } = require("@Helpers/contants");
const router = require("express").Router();
const middwarePerms = require("@Middwares/http/CmsPermission");
const BankController = require("@HttpControllers/Cms/BankController");


router.get("/withdraw", [middwarePerms(["view_app_bank_withrdraw"])], (req, res) => {
    BankController.listBankWithdraw(req, res);
});

module.exports = router;
