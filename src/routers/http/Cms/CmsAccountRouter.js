const { ERROR_PAGE } = require("@Helpers/contants");
const router = require("express").Router();
const middwarePerms = require("@Middwares/http/CmsPermission");
const _Controller = require("@HttpControllers/Cms/CmsAccountController");

router.get("/sys-perms", (req, res) => {
    _Controller.systemPerms(req, res);
});

router.get("/", [middwarePerms(["view_cms_account_list"])], (req, res) => {
    _Controller.listAccount(req, res);
});

router.post("/", [middwarePerms(["create_cms_account"])], (req, res) => {
    _Controller.Action.Create(req, res);
});

router.get("/account-info/:id", [middwarePerms(["view_cms_account_info"])], (req, res) => {
    _Controller.getAccountInfo(req, res);
});

router.post("/update/:id", [middwarePerms(["update_cms_account"])], (req, res) => {
    _Controller.Action.Update(req, res);
});

router.post("/update-permission/:id", [middwarePerms(["update_cms_account_permission"])], (req, res) => {
    _Controller.Action.UpdatePerm(req, res);
});

router.get("/delete/:id", [middwarePerms(["delete_cms_account"])], (req, res) => {
    _Controller.Action.Delete(req, res);
});

router.post("/change-password/:id", [middwarePerms(["change_password_cms_account"])], (req, res) => {
    _Controller.Action.changePassword(req, res);
});

module.exports = router;
