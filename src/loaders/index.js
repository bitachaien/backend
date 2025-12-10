
module.exports = async (socketInit = null, socketIoInit = null) => {
    // Server-Sent Events (SSE)
    require("./sse")();

    // websocket
    if (socketInit != null) {
        require("./services/initTaskProcessStorage")();
        require("./socket/initSocketFunctions")(socketInit);
    }
    // socketIo
    if (socketIoInit != null) {
        require("./socketIo/initSocketIoFunctions")(socketIoInit);
    }
};
