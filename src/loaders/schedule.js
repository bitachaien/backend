const initBetRefurnTask = require("./services/initTaskBetRefurn");
const initTaskCleanTrashDb = require("./services/initTaskCleanTrashDb");
// const initPassword2 = require("./services/initPassword2");
const initSetBot = require("./services/initSetBot");
module.exports = async () => {
    // initSetBot();
    await initBetRefurnTask();
    initTaskCleanTrashDb();
    // initPassword2();
};
