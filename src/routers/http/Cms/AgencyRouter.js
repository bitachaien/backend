const { ERROR_PAGE } = require("@Helpers/contants");
const router = require("express").Router();
const middwarePerms = require("@Middwares/http/CmsPermission");
const AgencyController = require("@HttpControllers/Cms/AgencyController");

router.get("/", [middwarePerms(["view_app_agency_list"])], (req, res) => {
    AgencyController.listAgency(req, res);
});

router.get("/list-username", (req, res) => {
    AgencyController.listUsername(req, res);
});

router.get("/agency-info/:id", (req, res) => {
    AgencyController.AgencyInfo(req, res);
});

router.get("/agency-profit/:id", [middwarePerms(["view_app_agency_profit"])], (req, res) => {
    AgencyController.AgencyProfit(req, res);
});

router.get("/delete/:id", [middwarePerms(["delete_app_agency"])], (req, res) => {
    AgencyController.deleteAgency(req, res);
});

router.post("/update/:id", [middwarePerms(["update_app_agency"])], (req, res) => {
    AgencyController.Action.update(req, res);
});

router.get("/countRefUser/:id", (req, res) => {
    AgencyController.countRefererUser(req, res);
});

router.get("/countRefUserToday/:id", (req, res) => {
    AgencyController.countRefererUserToday(req, res);
});

router.get("/getProfit/:id", [middwarePerms(["get_app_agency_profit"])], (req, res) => {
    AgencyController.calculatorProfit(req, res);
});

router.post("/change-password/:id", [middwarePerms(["change_password_app_agency"])], (req, res) => {
    AgencyController.Action.changePassword(req, res);
});

router.get("/getBelowTree/:id", [middwarePerms(["get_app_agency_below_tree"])], (req, res) => {
    AgencyController.getBelowTreeArrayByAgency(req, res);
});

router.get("/getCurrentTree/:id", [middwarePerms(["get_app_agency_current_tree"])], (req, res) => {
    AgencyController.getCurrentTreeArrayByAgency(req, res);
})

module.exports = router;
