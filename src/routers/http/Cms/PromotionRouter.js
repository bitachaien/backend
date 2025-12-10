const { ERROR_PAGE } = require("@Helpers/contants");
const router = require("express").Router();
const middwarePerms = require("@Middwares/http/CmsPermission");
const PromotionController = require("@HttpControllers/Cms/PromotionController");

router.get("/", [middwarePerms(["view_app_promotion_list"])], (req, res) => {
    PromotionController.listPromotion(req, res);
});

router.get("/delete/:id", [middwarePerms(["delete_app_promotion"])], (req, res) => {
    PromotionController.deletePromotion(req, res);
});

router.get("/promotion-info/:id", [middwarePerms(["view_app_promotion_info"])], (req, res) => {
    PromotionController.promotionInfo(req, res);
});

router.get("/promotion-registered/:id", [middwarePerms(["view_app_promotion_registered"])], (req, res) => {
    PromotionController.promotionRegisted(req, res);
});

router.post("/update/:id", [middwarePerms(["update_app_promotion_info"])], (req, res) => {
    PromotionController.Action.update(req, res);
});

router.post("/create", [middwarePerms(["create_app_promotion"])], (req, res) => {
    PromotionController.Action.create(req, res);
});

module.exports = router;
