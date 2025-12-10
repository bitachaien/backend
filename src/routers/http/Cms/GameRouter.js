const { ERROR_PAGE } = require("@Helpers/contants");
const router = require("express").Router();
// const middware = require('@Middwares/http/Authenticate');
const middwarePerms = require("@Middwares/http/CmsPermission");
const GameController = require("@HttpControllers/Cms/GameController");
const TaiXiuRouter = require("./TaiXiuRouter");
const XocXocRouter = require("./XocXocRouter");


router.get("/bet-history", [middwarePerms(["view_app_user_bet_history_list"])], (req, res) => {
  GameController.betHistory(req, res);
});
router.get("/bet-history/:id", [middwarePerms(["view_app_user_bet_history_by_user"])], (req, res) => {
  GameController.betHistoryByUser(req, res);
});
router.get("/gameAvalible", (req, res) => {
  GameController.gameAvalible(req, res);
});
router.get("/wallets/:id/:username", [middwarePerms(["view_app_user_wallet_game_balance"])], (req, res) => {
  GameController.wallets(req, res);
});
router.get("/bet-return", [middwarePerms(["view_app_user_bet_return_list"])], (req, res) => {
  GameController.betReturnHistory(req, res);
});
router.get("/wallet-retunn-all-point/:username", [middwarePerms(["return_all_point_user_wallet"])], (req, res) => {
  GameController.returnPointAllToProvider(req, res);
});

// tai xiu
router.use("/taixiu", TaiXiuRouter);
// xocdia
router.use("/xocxoc", XocXocRouter);

module.exports = router;
