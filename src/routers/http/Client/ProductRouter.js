const { ERROR_PAGE } = require("@Helpers/contants");
const router = require("express").Router();
// const middware = require('@Middwares/http/Authenticate');
const ProductController = require("@HttpControllers/Client/ProductController");

router.get("/", (req, res) => {
    ProductController.index(req, res);
});

router.get("/get-product-info/:product", (req, res) => {
    ProductController.getProductInfo(req, res);
});

router.get("/get-product/:gameType", (req, res) => {
    ProductController.getProductType(req, res);
});

router.get("/:productCode/:gameType", (req, res) => {
    ProductController.getGameList(req, res);
});

router.get("/dev/:productType/:gameType", (req, res) => {
    ProductController.categoryTest(req, res);
})

router.get("/fish", (req, res) => {
    ProductController.fish(req, res);
});

module.exports = router;