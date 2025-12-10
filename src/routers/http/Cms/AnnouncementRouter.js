const { ERROR_PAGE } = require("@Helpers/contants");
const router = require("express").Router();
const middwarePerms = require("@Middwares/http/CmsPermission");
const AnnouncementController = require("@HttpControllers/Cms/AnnouncementController");

router.get("/", [middwarePerms(["view_app_announcement_list"])], (req, res) => {
  AnnouncementController.listAnnouncement(req, res);
});

router.get("/delete/:id", [middwarePerms(["delete_app_announcement_list"])], (req, res) => {
  AnnouncementController.deleteAnnouncement(req, res);
});

router.get("/announcement-info/:id", [middwarePerms(["view_app_announcement_info"])], (req, res) => {
  AnnouncementController.announcementInfo(req, res);
});

router.post("/update/:id", [middwarePerms(["update_app_announcement"])], (req, res) => {
  AnnouncementController.Action.update(req, res);
});

router.post("/create", [middwarePerms(["create_app_announcement"])], (req, res) => {
  AnnouncementController.Action.create(req, res);
});

module.exports = router;
