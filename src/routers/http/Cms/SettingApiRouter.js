const { ERROR_PAGE } = require("@Helpers/contants");
const router = require("express").Router();
const _Controller = require("@HttpControllers/Cms/SettingApiController");

router.get("/api-config", (req, res) => {
    _Controller.ApiConfig.GetList(req, res);
});

router.post("/api-config", (req, res) => {
    _Controller.ApiConfig.Create(req, res);
});

router.post("/api-config/:id/delete", (req, res) => {
    _Controller.ApiConfig.Delete(req, res);
});

router.post("/api-config/:id/update", (req, res) => {
    _Controller.ApiConfig.Update(req, res);
});

router.get("/product-config", (req, res) => {
    _Controller.ProductConfig.GetList(req, res);
});

router.post("/product-config", (req, res) => {
    _Controller.ProductConfig.Create(req, res);
});

router.post("/product-config/:id/delete", (req, res) => {
    _Controller.ProductConfig.Delete(req, res);
});

router.post("/product-config/:id/update", (req, res) => {
    _Controller.ProductConfig.Update(req, res);
});

router.get("/game-config", (req, res) => {
    _Controller.GameConfig.GetList(req, res);
});

router.post("/game-config", (req, res) => {
    _Controller.GameConfig.Create(req, res);
});

router.post("/game-config/:id/delete", (req, res) => {
    _Controller.GameConfig.Delete(req, res);
});

router.post("/game-config/:id/update", (req, res) => {
    _Controller.GameConfig.Update(req, res);
});

module.exports = router;
