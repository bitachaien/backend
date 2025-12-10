const { ERROR_PAGE } = require("@Helpers/contants");
const router = require("express").Router();
const middwarePerms = require("@Middwares/http/CmsPermission");
const MessageController = require("@HttpControllers/Cms/MessageController");

router.get("/", [middwarePerms(["view_app_message_list"])], (req, res) => {
  MessageController.listMessage(req, res);
});

router.get("/delete/:id", [middwarePerms(["delete_app_message"])], (req, res) => {
  MessageController.deleteMessage(req, res);
});

router.get("/message-info/:id", [middwarePerms(["view_app_message_info"])], (req, res) => {
  MessageController.messageInfo(req, res);
});

router.post("/update/:id", [middwarePerms(["update_app_message_info"])], (req, res) => {
  MessageController.Action.update(req, res);
});

router.post("/create", [middwarePerms(["create_app_message"])], (req, res) => {
  MessageController.Action.create(req, res);
});

module.exports = router;
