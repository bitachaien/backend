const { ERROR_PAGE } = require("@Helpers/contants");
const router = require("express").Router();
// const middware = require('@Middwares/http/Authenticate');
const GameController = require("@HttpControllers/Client/GameController");

router.get("/subnames", (req, res) => {
  GameController.subnames(req, res);
});

router.get("/gameAvalible", (req, res) => {
  GameController.gameAvalible(req, res);
});

router.get("/launchgame/:id", (req, res) => {
  GameController.launchGame(req, res);
});

router.get("/wallets/:id", (req, res) => {
  GameController.wallets(req, res);
});

router.get("/history", (req, res) => {
  GameController.history(req, res);
});

router.post("/wallet-transfer", (req, res) => {
  GameController.walletTransfer(req, res);
});

router.get("/bet-refurn", (req, res) => {
  GameController.betRefurn(req, res);
});

router.get("/bet-refund-total", (req, res) => {
  GameController.getBetRefundTotal(req, res);
});

router.post("/bet-refund-claim", (req, res) => {
  GameController.claimBetRefund(req, res);
});

router.get("/balanceUpdate", (req, res) => {
  GameController.balanceUpdate(req, res);
});

router.get("/wallet-retunn-all-point", (req, res) => {
  GameController.returnPointAllToProvider(req, res);
});

module.exports = router;
