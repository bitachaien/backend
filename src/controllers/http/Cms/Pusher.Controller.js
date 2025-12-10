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

module.exports = {
    HandleConnection: async (req, res) => {
        const { room } = req.params;
        res.user = req.user;

        sse.createConnection(res, sse.GROUP_ENUMS.ADMINS, room, req.user.id); // Tạo kết nối đến phòng room1 trong nhóm chat
        // sse.deleteRoom('chat', 'room1'); // Xóa phòng room1 khỏi nhóm chat

        // console.log(sse.groups);
    },
    EmitMessage: async (req, res) => {
        const { room, uid } = req.params;
        const { message } = req.body;
        // sse.emitData(sse.GROUP_ENUMS.ADMINS, room, { message }, false, Number(uid));

        sse.emitData(sse.GROUP_ENUMS.ADMINS, "clients", {
            type: "deposit",
            data: {
                user: {
                    id: 123,
                    username: "LONGLON90VND",
                    name: "Vu Duy Luc",
                    role: "user"
                },
                isFirst: true,
                amountActuallyReceived: 350000,
                transaction: {
                    id: 23,
                    transId: "123456789",
                    amount: 3550000,
                    status: "SUCCESS",
                    type: "recharge",
                    is_first: true,
                }
            }
        }, true, null);

        // check

        return res.json({ status: true, msg: "message sent successfully!" });
    },
};