const { ERROR_PAGE } = require("@Helpers/contants");
const router = require("express").Router();
const middwarePerms = require("@Middwares/http/CmsPermission");
const DepositCardController = require("@HttpControllers/Cms/DepositCardController");

router.get("/", [middwarePerms(["view_app_deposit_card_list"])], (req, res) => {
    DepositCardController.listDeposit(req, res);
});

router.get("/delete/:id", [middwarePerms(["delete_app_deposit_card"])], (req, res) => {
    DepositCardController.deleteDeposit(req, res);
});

router.get("/deposit-info/:id", [middwarePerms(["view_app_deposit_card_info"])], (req, res) => {
    DepositCardController.depositInfo(req, res);
});

router.post("/update/:id", [middwarePerms(["update_app_deposit_card"])], (req, res) => {
    DepositCardController.Action.update(req, res);
});

module.exports = router;
