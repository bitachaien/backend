const { ERROR_PAGE } = require("@Helpers/contants");
const router = require("express").Router();
const middware = require('@Middwares/http/Authenticate');
const VipController = require("@HttpControllers/Client/VipController");

router.get("/", middware, (req, res) => {
    VipController.getCurrentVip(req, res);
});

router.get("/get-vip-config", (req, res) => {
    VipController.getVipConfig(req, res);
});

router.post("/get-vip-reward", middware, (req, res) => {
    VipController.getVipReward(req, res);
});

// router.get("/:productType/:gameType", (req, res) => {
//     VipController.category(req, res);
// });

module.exports = router;