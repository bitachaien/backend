const entryRouterPath = `/entry`;
const EntryController = require('@EntryControllers/RechargeController');

module.exports = (app, io) => {
    app.get(`${entryRouterPath}/callback/recharge`, (req, res) => {
        EntryController.Recharge(req, res, io);
    });
    app.get(`${entryRouterPath}/callback/recharge-test`, (req, res) => {
        EntryController.RechargeTest(req, res, io);
    });
    app.post(`${entryRouterPath}/callback/recharge/bestgate`, (req, res) => {
        EntryController.BestGate(req, res, io);
    });
    // app.get(`${entryRouterPath}/callback/rechargeWallet`, (req, res) => {
    //     EntryController.RechargeWallet(req, res, io);
    // });
    app.get(`${entryRouterPath}/callback/rechargeCard`, (req, res) => {
        EntryController.RechargeCard(req, res, io);
    });
};