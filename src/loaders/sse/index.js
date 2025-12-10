const initSse = require('./initSse');

module.exports = () => {
    // global varible sse
    global.sse = new initSse();
}