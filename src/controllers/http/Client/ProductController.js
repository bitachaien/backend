const {
    ERROR_PAGE,
    ERROR_FORM,
    ERROR_AUTH,
    ERROR_AUTH_MESSAGE,
    ERROR_MESSAGES
} = require("@Helpers/contants");
const Helper = require("@Helpers/helpers");
const { parseInt } = require("@Helpers/Number");
const redis = require("@Databases/redis");
const TcgService = require("@Plugins/TcgService");
const subnamesConfig = require("@Configs/game/subnamesConfig.json");
const gameConfig = require("@Configs/game/gameConfig.json");

const { ApiConfigModel } = require("@Models/GameApi/ApiConfig");
const { ApiProductConfigModel } = require("@Models/GameApi/ApiProductConfig");
const { ApiGameConfigModel } = require("@Models/GameApi/ApiGameConfig");

module.exports = {
    index: async (req, res) => {
        try {
            res.status(200).json({
                status: true,
                msg: "success",
                code: 200
            });
        } catch (e) {
            console.log(e);
            res.status(200).json({
                status: false,
                msg: e.message,
                code: 500
            });
        }
    },
    getProductInfo: async (req, res) => {
        try {
            let { product } = req.params;
            if (!product) return res.status(200).json({ status: false, msg: "Error Missing Param!" });

            product = product.toUpperCase();

            const getProductConfig = await ApiProductConfigModel.getProductByCode(String(product));
            if (!getProductConfig) return res.status(200).json({
                status: false,
                msg: `Không tìm thấy Product Code này!`,
                code: 404
            });

            return res.status(200).json({
                status: true,
                data: getProductConfig,
                code: 200
            });
        } catch (e) {
            console.log(e);
            return res.status(200).json({
                status: false,
                msg: e.message,
                code: 500
            });
        }
    },
    getProductType: async (req, res) => {
        try {
            const { gameType } = req.params;
            if (!gameType) return res.status(200).json({ status: false, msg: "Error Missing Param!" });

            // nêú không yêu cầu game type
            if (gameType.toUpperCase() == "ALL") {
                let product = await ApiGameConfigModel.findAll({
                    attributes: ['product_code'],
                    group: ['product_code']
                });
                let listPromise = [];
                product.map(async product => {
                    listPromise.push(ApiProductConfigModel.findOne({
                        where: { product_code: product.product_code },
                        attributes: { exclude: ["id", "updatedAt", "deletedAt"] }
                    }))
                });

                await Promise.allSettled(listPromise).then((result) => {
                    let product = [];
                    result.forEach((result) => {
                        if (result.status === "fulfilled") {
                            if (result.value) product.push(result.value);
                        }
                    });
                    return res.status(200).json({
                        status: true,
                        data: product
                    });
                });
                return;
            }

            const GAME_TYPE_ENUM = Object.values(ApiGameConfigModel.GAME_TYPE);

            if (!GAME_TYPE_ENUM.includes(gameType.toUpperCase())) return res
                .status(200)
                .json({ status: false, msg: "Game Type không hợp lệ!" });

            let product = await ApiGameConfigModel.findAll({
                attributes: ['product_code'],
                group: ['product_code'],
                where: { game_type: gameType.toUpperCase() }
            });
            let listPromise = [];
            product.map(async product => {
                listPromise.push(ApiProductConfigModel.findOne({
                    where: { product_code: product.product_code },
                    attributes: { exclude: ["id", "updatedAt", "deletedAt"] }
                }))
            });

            await Promise.allSettled(listPromise).then((result) => {
                let product = [];
                result.forEach((result) => {
                    if (result.status === "fulfilled") {
                        if (result.value) product.push(result.value);
                    }
                });
                return res.status(200).json({
                    status: true,
                    data: product
                });
            });
            return;
        } catch (e) {
            console.log(e);
            return res.status(200).json({
                status: true
            });
        }
    },
    getGameList: async (req, res) => {
        try {
            const { productCode, gameType } = req.params;
            if (!productCode || !gameType) return res.status(200).json({ status: false, msg: "Error Missing Param!" });

            const GAME_TYPE_ENUM = Object.values(ApiGameConfigModel.GAME_TYPE);
            if (!GAME_TYPE_ENUM.includes(gameType.toUpperCase())) return res
                .status(200)
                .json({ status: false, msg: "Game Type không hợp lệ!" });

            // nêú không yêu cầu game type
            if (productCode.toUpperCase() == "ALL") {
                let games = await ApiGameConfigModel.findAll({
                    where: { game_type: gameType.toUpperCase() }
                });
                return res.status(200).json({
                    status: true,
                    data: {
                        status: 0,
                        games: games,
                        error_desc: null
                    }
                });
            }

            let games = await ApiGameConfigModel.findAll({
                where: {
                    product_code: productCode.toUpperCase(),
                    game_type: gameType.toUpperCase()
                }
            });
            return res.status(200).json({
                status: true,
                data: {
                    status: 0,
                    games: games,
                    error_desc: null
                }
            });

        } catch (e) {
            console.log(e);
            return res.status(200).json({
                status: true
            });
        }
    },
    // category: async (req, res) => {
    //     try {
    //         const gameTypeConfig = ["RNG", "FISH", "LIVE", "PVP", "SPORTS", "ELOTT", "CHESS"];
    //         const { productType, gameType } = req.params;
    //         if (!productType || !gameType) return res.status(200).json({ status: false, msg: "Error Missing Param!" });
    //         if (!subnamesConfig.includes(productType.toUpperCase())) return res.status(200).json({ status: false, msg: "Nhà cung cấp trò chơi này hiện tại không khả dụng! Xin trân thành xin lỗi quý khách hàng vì sự thiếu sót này." });
    //         console.log(1);
    //         if (!gameConfig.hasOwnProperty(productType.toUpperCase())) return res.status(200).json({ status: false, msg: "Nhà cung cấp trò chơi này hiện tại không khả dụng! Xin trân thành xin lỗi quý khách hàng vì sự thiếu sót này." });
    //         console.log(2);
    //         if (!gameTypeConfig.includes(gameType.toUpperCase())) return res.status(200).json({ status: false, msg: "Nhà cung cấp trò chơi này hiện tại không khả dụng! Xin trân thành xin lỗi quý khách hàng vì sự thiếu sót này." });

    //         const getConfig = Helper.getConfigGameByProduct(productType.toUpperCase(), gameType.toLowerCase());

    //         if (!!getConfig) {
    //             let dataExport = {
    //                 status: 0,
    //                 games: [],
    //                 error_desc: null
    //             };

    //             for (const [key, value] of Object.entries(getConfig)) {
    //                 dataExport.games.push({
    //                     displayStatus: 0,
    //                     gameType: gameType.toUpperCase(),
    //                     gameName: value.name,
    //                     tcgGameCode: key,
    //                     productCode: productType.toUpperCase(),
    //                     productType: gameConfig[productType.toUpperCase()].type,
    //                     platform: "html5,html5-desktop",
    //                     gameSubType: "PVP",
    //                     trialSupport: false,
    //                     icon: value.icon
    //                 });
    //             }

    //             res.status(200).json({
    //                 status: true,
    //                 data: dataExport
    //             });
    //         } else {
    //             const redisKey = `getListGame:${productType.toUpperCase()}:${gameType.toUpperCase()}`;
    //             const checkRedis = await redis.get(redisKey);

    //             if (!checkRedis) {
    //                 const tcgService = new TcgService(Helper.getValueOfKeyObject(TcgConfig, gameConfig[productType.toUpperCase()].config));

    //                 const getGameList = await tcgService.getGameList(
    //                     gameConfig[productType.toUpperCase()].type,
    //                     "html5",
    //                     "web",
    //                     gameType.toUpperCase()
    //                 );
    //                 redis.set(redisKey, {
    //                     status: true,
    //                     data: getGameList
    //                 });
    //                 res.status(200).json({
    //                     status: true,
    //                     data: getGameList
    //                 });
    //             } else {
    //                 res.status(200).json(checkRedis);
    //             }
    //         }
    //     } catch (e) {
    //         console.log(e);
    //         res.status(200).json({
    //             status: true
    //         });
    //     }
    // },
    fish: async (req, res) => {
        try {
            const getConfig = Helper.getConfigGameByProduct("ALL", "fish");
            let dataExport = {
                status: 0,
                games: [],
                error_desc: null
            };

            for (const [key, value] of Object.entries(getConfig)) {
                // console.log(value.product);
                if (gameConfig[value.product]) {
                    dataExport.games.push({
                        displayStatus: 0,
                        gameType: value.product,
                        gameName: value.name,
                        tcgGameCode: key,
                        productCode: value.product,
                        productType: gameConfig[value.product].type,
                        platform: "html5,html5-desktop",
                        gameSubType: "FISH",
                        trialSupport: false,
                        icon: value.icon
                    });
                }
            }


            console.log(dataExport)
            res.status(200).json({
                status: true,
                data: dataExport
            });
        } catch (e) {
            console.log(e);
            res.status(200).json({
                status: true
            });
        }
    },
};
