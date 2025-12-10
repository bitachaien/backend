const { Op } = require("sequelize");
const {
    ERROR_PAGE,
    ERROR_FORM,
    ERROR_AUTH,
    ERROR_AUTH_MESSAGE,
    ERROR_MESSAGES
} = require("@Helpers/contants");
const Helper = require("@Helpers/helpers");
const { parseInt } = require("@Helpers/Number");
const { findByID, findByUsername, UserModel } = require("@Models/User/User");

const { XocXocUserModel } = require("@Models/Game/XocXoc/User");
const { XocXocSessionModel } = require("@Models/Game/XocXoc/Session");
const { XocXocBetOrderModel } = require("@Models/Game/XocXoc/BetOrder");

module.exports = {
    list: async function (req, res) {
        try {
            const { id } = req.params;

            if (!id) {
                return res.status(200).json({
                    status: false,
                    msg: "Missing Param ID"
                });
            }

            if (!Number(id) >> 0) {
                return res.status(200).json({
                    status: false,
                    msg: "Err ID"
                });
            }

            const page = parseInt(req.query.page, true)
                ? parseInt(req.query.page, true)
                : 0;
            const kmess = parseInt(req.query.limit, true)
                ? parseInt(req.query.limit, true)
                : 0;

            if (!!page && !!kmess) {

                const user = await UserModel.findOne({
                    where: { id, role: UserModel.ROLE_ENUM.USER },
                    attributes: { exclude: ["password", "role", "deletedAt"] }
                });

                if (!user) return res.status(200).json({
                    status: false,
                    msg: "User not found"
                });

                let match = {};
                match.uid = id;
                match.paid = XocXocBetOrderModel.PAID_ENUM.TRUE;

                // filter
                if (!!req.query.session) {
                    match.session = { [Op.like]: `%${req.query.session}%` };
                }
                if (!!req.query.amount) {
                    match.amount = { [Op.like]: `%${req.query.amount}%` };
                }
                if (!!req.query.is_win) {
                    match.phone = { [Op.like]: `%${req.query.is_win}%` };
                }

                const total = await XocXocBetOrderModel.count({ where: match, distinct: false });

                const dataExport = await XocXocBetOrderModel.findAll({
                    where: match,
                    offset: 0 + (page - 1) * kmess,
                    limit: kmess,
                    order: [["id", "DESC"]],
                    include: [{
                        model: XocXocSessionModel,
                        as: "session_info"
                    }, {
                        model: UserModel,
                        as: "user_info"
                    },]     
                });

                return res.status(200).json({
                    status: true,
                    data: {
                        dataExport: dataExport,
                        page: page,
                        kmess: kmess,
                        total: total
                    },
                    msg: "SUCCESS"
                });
            } else {
                res.status(200).json({
                    status: false,
                    msg: ERROR_FORM.MISSING_FIELD
                });
            }

        } catch (e) {
            console.log(e);
            res.status(200).json({
                status: false,
                msg: e.message,
                code: 500
            });
        }
    }
};  