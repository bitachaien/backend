const { ERROR_PAGE } = require("@Helpers/contants");
const router = require("express").Router();
const middwarePerms = require("@Middwares/http/CmsPermission");
const _Controller = require("@HttpControllers/Cms/TaiXiuController");


router.get("/history/:id", [middwarePerms(["view_taixiu_history_list"])], (req, res) => {
    _Controller.list(req, res);
});


module.exports = router;




