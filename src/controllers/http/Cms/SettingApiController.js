const { Op } = require("sequelize");
const redis = require("@Databases/redis");
const Helper = require("@Helpers/helpers");
const {
    ERROR_PAGE,
    ERROR_FORM,
    ERROR_AUTH,
    ERROR_AUTH_MESSAGE,
    ERROR_MESSAGES,
    SUCCESS
} = require("@Helpers/contants");
const { parseInt } = require("@Helpers/Number");

const { ApiConfigModel } = require("@Models/GameApi/ApiConfig");
const { ApiGameConfigModel } = require("@Models/GameApi/ApiGameConfig");
const { ApiProductConfigModel } = require("@Models/GameApi/ApiProductConfig");

module.exports = {
    index: async (req, res) => {
        try {
            res.status(200).json({
                status: true,
                msg: SUCCESS,
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
    ApiConfig: {
        GetList: async (req, res) => {
            try {
                const getData = await ApiConfigModel.findAll({
                    where: {},
                    order: [["id", "DESC"]],
                    attributes: { exclude: ["deletedAt"] }
                });
                return res.status(200).json({
                    status: true,
                    data: getData,
                    msg: "SUCCESS"
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
        Create: async (req, res) => {
            try {
                const {
                    api_name,
                    api_product,
                    api_config,
                    description,
                    logo
                } = req.body;

                const create = await ApiConfigModel.create({
                    api_name,
                    api_product,
                    api_config,
                    description,
                    logo
                });

                if (!create) return res.status(200).json({
                    status: false,
                    msg: "Error create!",
                    code: 500
                });

                return res.status(200).json({
                    status: true,
                    data: create,
                    msg: "SUCCESS"
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
        Delete: async (req, res) => {
            try {
                try {
                    const { id } = req.params;
    
                    const deleteItem = await ApiConfigModel.destroy({
                        where: { id },
                        force: true
                    });
    
                    if (!!deleteItem) {
                        return res.status(200).json({
                            status: true,
                            data: null,
                            msg: "Success"
                        });
                    } else {
                        return res.status(200).json({
                            status: false,
                            msg: "Err Delete"
                        });
                    }
                } catch (e) {
                    console.log(e);
                    return res.status(200).json({
                        status: false,
                        msg: e.message,
                        code: 500
                    });
                }
            } catch (e) {
                console.log(e);
                return res.status(200).json({
                    status: false,
                    msg: e.message,
                    code: 500
                });
            }
        },
        Update: async (req, res) => {
            try {
                console.log("ApiConfig.Update called with:", req.params, req.body);
                const { id } = req.params;
                const {
                    api_name,
                    api_product,
                    api_config,
                    description,
                    logo,
                    is_mainternance
                } = req.body;

                const checkExist = await ApiConfigModel.findOne({ where: { id } });
                if (!checkExist) {
                    console.log("Api Config not found for id:", id);
                    return res.status(200).json({
                        status: false,
                        msg: "Api Config not found!",
                        code: 404
                    });
                }

                // Check if api_name is being changed and if it already exists
                if (api_name && api_name !== checkExist.api_name) {
                    const checkApiName = await ApiConfigModel.findOne({ where: { api_name } });
                    if (checkApiName) return res.status(200).json({
                        status: false,
                        msg: "Api Name already exists!",
                        code: 400
                    });
                }

                const updateData = {};
                if (api_name !== undefined) updateData.api_name = api_name;
                if (api_product !== undefined) updateData.api_product = api_product;
                if (api_config !== undefined) updateData.api_config = api_config;
                if (description !== undefined) updateData.description = description;
                if (logo !== undefined) updateData.logo = logo;
                if (is_mainternance !== undefined) updateData.is_mainternance = is_mainternance;

                const update = await ApiConfigModel.update(updateData, {
                    where: { id }
                });

                if (!update || update[0] === 0) return res.status(200).json({
                    status: false,
                    msg: "Error update!",
                    code: 500
                });

                const updatedItem = await ApiConfigModel.findOne({ where: { id } });

                console.log("ApiConfig.Update success:", updatedItem);
                return res.status(200).json({
                    status: true,
                    data: updatedItem,
                    msg: "SUCCESS"
                });
            } catch (e) {
                console.error("ApiConfig.Update error:", e);
                console.error("Error stack:", e.stack);
                // Đảm bảo luôn có response
                if (!res.headersSent) {
                    return res.status(200).json({
                        status: false,
                        msg: e.message || "Internal server error",
                        code: 500
                    });
                }
            }
        }
    },
    ProductConfig: {
        GetList: async (req, res) => {
            try {
                const getData = await ApiProductConfigModel.findAll({
                    where: {},
                    order: [["id", "DESC"]],
                    attributes: { exclude: ["deletedAt"] }
                });
                return res.status(200).json({
                    status: true,
                    data: getData,
                    msg: "SUCCESS"
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
        Create: async (req, res) => {
            try {
                const {
                    product_api,
                    product_name,
                    product_code,
                    product_type,
                    product_mode,
                    description,
                    logo,
                    thumbnail,
                    icon
                } = req.body;

                const checkExistProductApi = await ApiConfigModel.findOne({ where: { api_name: product_api } });
                if (!checkExistProductApi) return res.status(200).json({
                    status: false,
                    msg: "Api Config not found!",
                    code: 500
                });

                const checkExistProductCode = await ApiProductConfigModel.findOne({ where: { product_code } });
                if (checkExistProductCode) return res.status(200).json({
                    status: false,
                    msg: "Product Code exited!",
                    code: 500
                });
                const checkExistProductName = await ApiProductConfigModel.findOne({ where: { product_name } });
                if (checkExistProductName) return res.status(200).json({
                    status: false,
                    msg: "Product Name exited!",
                    code: 500
                });
                const checkExistProductType = await ApiProductConfigModel.findOne({ where: { product_type } });
                if (checkExistProductType) return res.status(200).json({
                    status: false,
                    msg: "Product Type exited!",
                    code: 500
                });

                const create = await ApiProductConfigModel.create({
                    product_api,
                    product_name,
                    product_code,
                    product_type,
                    product_mode,
                    description,
                    logo,
                    thumbnail,
                    icon
                });

                if (!create) return res.status(200).json({
                    status: false,
                    msg: "Error create!",
                    code: 500
                });

                return res.status(200).json({
                    status: true,
                    data: create,
                    msg: "SUCCESS"
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
        Delete: async (req, res) => {
            try {
                const { id } = req.params;

                const deleteItem = await ApiProductConfigModel.destroy({
                    where: { id },
                    force: true
                });

                if (!!deleteItem) {
                    return res.status(200).json({
                        status: true,
                        data: null,
                        msg: "Success"
                    });
                } else {
                    return res.status(200).json({
                        status: false,
                        msg: "Err Delete"
                    });
                }
            } catch (e) {
                console.log(e);
                return res.status(200).json({
                    status: false,
                    msg: e.message,
                    code: 500
                });
            }
        },
        Update: async (req, res) => {
            try {
                const { id } = req.params;
                const {
                    product_api,
                    product_name,
                    product_code,
                    product_type,
                    product_mode,
                    description,
                    logo,
                    thumbnail,
                    icon
                } = req.body;

                console.log("ProductConfig.Update called:", { id, body: req.body });

                const existing = await ApiProductConfigModel.findOne({ where: { id } });
                if (!existing) {
                    return res.status(200).json({
                        status: false,
                        msg: "Product Config not found!",
                        code: 404
                    });
                }

                // Check if product_api is being changed and if the new api exists
                if (product_api && product_api !== existing.product_api) {
                    const apiExist = await ApiConfigModel.findOne({ where: { api_name: product_api } });
                    if (!apiExist) return res.status(200).json({
                        status: false,
                        msg: "Api Config not found!",
                        code: 400
                    });
                }

                // Kiểm tra trùng product_code nếu thay đổi
                if (product_code && product_code !== existing.product_code) {
                    const codeExist = await ApiProductConfigModel.findOne({ where: { product_code } });
                    if (codeExist) return res.status(200).json({
                        status: false,
                        msg: "Product Code exited!",
                        code: 400
                    });
                }

                // Kiểm tra trùng product_name nếu thay đổi
                if (product_name && product_name !== existing.product_name) {
                    const nameExist = await ApiProductConfigModel.findOne({ where: { product_name } });
                    if (nameExist) return res.status(200).json({
                        status: false,
                        msg: "Product Name exited!",
                        code: 400
                    });
                }

                // Kiểm tra trùng product_type nếu thay đổi
                if (product_type && product_type !== existing.product_type) {
                    const typeExist = await ApiProductConfigModel.findOne({ where: { product_type } });
                    if (typeExist) return res.status(200).json({
                        status: false,
                        msg: "Product Type exited!",
                        code: 400
                    });
                }

                // Chuẩn bị dữ liệu cập nhật
                const updateData = {};
                if (product_api !== undefined) updateData.product_api = product_api;
                if (product_name !== undefined) updateData.product_name = product_name;
                if (product_code !== undefined) updateData.product_code = product_code;
                if (product_type !== undefined) updateData.product_type = product_type;
                if (product_mode !== undefined) updateData.product_mode = product_mode;
                if (description !== undefined) updateData.description = description;
                if (logo !== undefined) updateData.logo = logo;
                if (thumbnail !== undefined) updateData.thumbnail = thumbnail;
                if (icon !== undefined) updateData.icon = icon;

                const [affectedRows] = await ApiProductConfigModel.update(updateData, { where: { id } });

                console.log("ProductConfig.Update affectedRows:", affectedRows);

                if (!affectedRows) {
                    return res.status(200).json({
                        status: false,
                        msg: "Error update!",
                        code: 500
                    });
                }

                const updatedItem = await ApiProductConfigModel.findOne({ where: { id } });

                console.log("ProductConfig.Update updatedItem:", updatedItem && updatedItem.toJSON ? updatedItem.toJSON() : updatedItem);

                // nếu có cache, invalidate ở đây (ví dụ redis.del(...))

                return res.status(200).json({
                    status: true,
                    data: updatedItem,
                    msg: "SUCCESS"
                });
            } catch (e) {
                console.error("ProductConfig.Update error:", e);
                return res.status(200).json({
                    status: false,
                    msg: e.message || "Internal server error",
                    code: 500
                });
            }
        }
    },
    GameConfig: {
        GetList: async (req, res) => {
            try {

                const page = parseInt(req.query.page, true)
                    ? parseInt(req.query.page, true)
                    : 1;
                const kmess = parseInt(req.query.limit, true)
                    ? parseInt(req.query.limit, true)
                    : 10;

                let match = {};

                // filter
                if (!!req.query.game_code) {
                    match.game_code = { [Op.like]: `%${req.query.game_code}%` };
                }
                if (!!req.query.game_name) {
                    match.game_name = { [Op.like]: `%${req.query.game_name}%` };
                }
                if (!!req.query.product_type) {
                    match.product_type = { [Op.like]: `%${req.query.product_type}%` };
                }
                if (!!req.query.game_type) {
                    match.game_type = req.query.game_type;
                }

                const total = await ApiGameConfigModel.count({ where: match });

                const getData = await ApiGameConfigModel.findAll({
                    where: match,
                    offset: 0 + (page - 1) * kmess,
                    limit: kmess,
                    order: [["id", "DESC"]],
                    attributes: { exclude: ["deletedAt"] }
                });

                return res.status(200).json({
                    status: true,
                    data: {
                        dataExport: getData,
                        page: page,
                        kmess: kmess,
                        total: total
                    },
                    msg: "SUCCESS"
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
        Create: async (req, res) => {
            try {
                const {
                    product_type,
                    product_code,
                    game_type,
                    game_code,
                    game_name,
                    game_icon,
                    game_trial_support,
                    is_hot,
                    description
                } = req.body;

                const checkProductType = await ApiProductConfigModel.findOne({ where: { product_type: product_type } });
                if (!checkProductType) return res.status(200).json({
                    status: false,
                    msg: "Product not found!",
                    code: 500
                });

                const checkExistGameCode = await ApiGameConfigModel.findOne({ where: { game_code } });
                if (checkExistGameCode) return res.status(200).json({
                    status: false,
                    msg: "Game Code exited!",
                    code: 500
                });

                const create = await ApiGameConfigModel.create({
                    product_type,
                    product_code: checkProductType.product_code,
                    game_type,
                    game_code,
                    game_name,
                    game_icon,
                    game_trial_support,
                    is_hot,
                    description
                });

                if (!create) return res.status(200).json({
                    status: false,
                    msg: "Error create!",
                    code: 500
                });

                return res.status(200).json({
                    status: true,
                    data: create,
                    msg: "SUCCESS"
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
        Delete: async (req, res) => {
            try {
                const { id } = req.params;

                const deleteItem = await ApiGameConfigModel.destroy({
                    where: { id },
                    force: true
                });

                if (!!deleteItem) {
                    return res.status(200).json({
                        status: true,
                        data: null,
                        msg: "Success"
                    });
                } else {
                    return res.status(200).json({
                        status: false,
                        msg: "Err Delete"
                    });
                }
            } catch (e) {
                console.log(e);
                return res.status(200).json({
                    status: false,
                    msg: e.message,
                    code: 500
                });
            }
        },
        Update: async (req, res) => {
            try {
                const { id } = req.params;
                const {
                    product_type,
                    game_type,
                    game_code,
                    game_name,
                    game_icon,
                    game_trial_support,
                    is_hot,
                    description
                } = req.body;

                console.log("GameConfig.Update called:", { id, body: req.body });

                const existing = await ApiGameConfigModel.findOne({ where: { id } });
                if (!existing) {
                    return res.status(200).json({
                        status: false,
                        msg: "Game Config not found!",
                        code: 404
                    });
                }

                // validate product_type exists
                if (product_type && product_type !== existing.product_type) {
                    const prodExist = await ApiProductConfigModel.findOne({ where: { product_type } });
                    if (!prodExist) return res.status(200).json({
                        status: false,
                        msg: "Product not found!",
                        code: 400
                    });
                }

                const updateData = {};
                if (product_type !== undefined) updateData.product_type = product_type;
                if (game_type !== undefined) updateData.game_type = game_type;
                if (game_code !== undefined) updateData.game_code = game_code;
                if (game_name !== undefined) updateData.game_name = game_name;
                if (game_icon !== undefined) updateData.game_icon = game_icon;
                if (game_trial_support !== undefined) updateData.game_trial_support = game_trial_support;
                if (is_hot !== undefined) updateData.is_hot = is_hot;
                if (description !== undefined) updateData.description = description;

                const [affectedRows] = await ApiGameConfigModel.update(updateData, { where: { id } });
                console.log("GameConfig.Update affectedRows:", affectedRows);

                if (!affectedRows) {
                    return res.status(200).json({
                        status: false,
                        msg: "Error update!",
                        code: 500
                    });
                }

                const updatedItem = await ApiGameConfigModel.findOne({ where: { id } });
                console.log("GameConfig.Update updatedItem:", updatedItem && updatedItem.toJSON ? updatedItem.toJSON() : updatedItem);

                // invalidate cache if used

                return res.status(200).json({
                    status: true,
                    data: updatedItem,
                    msg: "SUCCESS"
                });
            } catch (e) {
                console.error("GameConfig.Update error:", e);
                return res.status(200).json({
                    status: false,
                    msg: e.message || "Internal server error",
                    code: 500
                });
            }
        }
    },
};
