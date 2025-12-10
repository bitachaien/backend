process.on('uncaughtException', function (err) {
    console.error('Uncaught Exception:', err);
});

async function startServer() {
    try {
        // sentry service
        require("./instrument.js");

        require('module-alias/register');

        /**
        * Initialization Database Connection.
        */
        require('@Connect');

        /**
        * Start express server.
        */
        require('@Express');

        /**
        * Start socketIo server.
        */
        require('@SocketIO');
    } catch (error) {
        // console.log("Failed to initialize services", )
        throw new Error(error);
    }
}

startServer();