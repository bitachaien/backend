/****
 * Copyright kunkeypr 2024
 * Tele: https://t.me/bruhh_lmao
 * Express Server Send Event 
 * Description: One-way connection, the server only sends data to the client
 */

/*** Ví dụ sử dụng */
// nhớ gán authen req.user = authen data trong middleware trước khi đi vào router
/// 2 hàm bên dưới là controller của 2 router 
// 
// 1: router lắng nghe = GET => /:room_name
// 2: router phát tin nhắn = POST /:room_name/:uid_recive_message
//    body = {"message": "tin nhan gui di"}
// HandleConnection: async (req, res) => {
//     const { room } = req.params;
//     res.user = req.user;

//     sse.createConnection(res, sse.GROUP_ENUMS.ADMINS, room, req.user.id); // Tạo kết nối đến phòng room1 trong nhóm chat
//     // sse.deleteRoom(sse.GROUP_ENUMS.ADMINS, room); // Xóa phòng room khỏi nhóm chat
//     // console.log(sse.groups);
// },
// EmitMessage: async (req, res) => {
//     const { room, uid } = req.params;
//     const { message } = req.body;
//     sse.emitData(sse.GROUP_ENUMS.ADMINS, room, { message }, false, Number(uid));
//     return res.json({ status: true, msg: "message sent successfully!" });
// },


const EventEmitter = require('events');

class SSE {
    constructor() {
        this.groups = new Map(); // Lưu trữ các nhóm và các phòng (room)
        this.emitter = new EventEmitter(); // Sử dụng để phát ra các sự kiện
        this.GROUP_ENUMS = {
            USERS: "users",
            AGENTS: "agents",
            ADMINS: "admins"
        };
    }

    createConnection(res, group, room, user) {
        // Thiết lập header cho kết nối SSE
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            "Content-Encoding": "none"
        });

        // Tạo nhóm và phòng nếu chưa tồn tại
        if (!this.groups.has(group)) this.groups.set(group, new Map());
        const groupData = this.groups.get(group);
        if (!groupData.has(room)) groupData.set(room, new Map());

        // xóa kết nối trước đó
        this.deleteConnection(group, room, user);

        // Thêm kết nối vào phòng
        groupData.get(room).set(user, res);

        this.emitSse(res, { user: res.user });

        // Xử lý sự kiện đóng kết nối (bạn có thể thêm logic xử lý ở đây)
        res.on('close', () => {
            this.deleteConnection(group, room, user);
        });
    }

    deleteConnection(group, room, user) {
        // Kiểm tra xem nhóm và phòng có tồn tại không
        if (!this.groups.has(group) || !this.groups.get(group).has(room)) return;

        const groupData = this.groups.get(group);
        const roomData = groupData.get(room);

        // Xóa kết nối khỏi phòng
        if (roomData.has(user)) {
            roomData.delete(user);
        }
    }

    deleteRoom(group, room) {
        // Kiểm tra xem nhóm và phòng có tồn tại không
        if (!this.groups.has(group) || !this.groups.get(group).has(room)) return;

        const groupData = this.groups.get(group);
        const roomData = groupData.get(room);

        // Đóng tất cả các kết nối trong phòng
        roomData.forEach((connection, userId) => {
            this.emitSse(connection, data);
            connection.end();
        });

        // Xóa phòng khỏi nhóm
        groupData.delete(room);
    }

    emitSchema(data = {}, status = true, sseId = null) {
        return { status, data, sseId };
    }

    emitSse(res, data = {}, status = true, sseId = null) {
        if (typeof res != "object") return;
        sseId = (!sseId) ? Date.now() : sseId;
        res.write(`id: ${sseId}\n`);
        res.write(`event: message\n`);
        res.write(`data: ${JSON.stringify(this.emitSchema(data, status, sseId))}\n\n`);
    }

    emitData(group, room, data = {}, status = true, userId = null) {
        // Kiểm tra xem nhóm và phòng có tồn tại không
        if (!this.groups.has(group) || !this.groups.get(group).has(room)) return;

        // Lấy danh sách các kết nối trong phòng
        const groupData = this.groups.get(group);
        const roomData = groupData.get(room);

        // Nếu userId được cung cấp, chỉ gửi tin nhắn cho người dùng đó
        if (userId) {
            const connection = roomData.get(userId);
            this.emitSse(connection, data, status);
            return;
        }

        // Nếu không có userId, gửi tin nhắn cho tất cả người dùng trong phòng
        roomData.forEach((connection) => {
            // connection.write(`data: ${JSON.stringify(data)}\n\n`);
            this.emitSse(connection, data, status);
        });
    }
}

module.exports = SSE;