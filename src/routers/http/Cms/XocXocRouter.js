const { ERROR_PAGE } = require("@Helpers/contants");
const router = require("express").Router();
const middwarePerms = require("@Middwares/http/CmsPermission");
const _Controller = require("@HttpControllers/Cms/XocXocController");


router.get("/history/:id", [middwarePerms(["view_xocxoc_history_list"])], (req, res) => {
    _Controller.list(req, res);
});


module.exports = router;