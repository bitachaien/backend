const { ERROR_PAGE } = require("@Helpers/contants");
const router = require("express").Router();
const middwarePerms = require("@Middwares/http/CmsPermission");
const _Controller = require("@HttpControllers/Cms/Pusher.Controller");

// router listens message from server
router.get("/:room", [middwarePerms(["push_notification"])], (req, res) => {
    _Controller.HandleConnection(req, res);
});

// router send message 
router.post("/:room/:uid/emit", (req, res) => {
    _Controller.EmitMessage(req, res);
});

module.exports = router;