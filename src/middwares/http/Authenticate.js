const { ERROR_AUTH } = require("@Helpers/contants");
const { UserModel, findByID } = require("@Models/User/User");
const { verifyToken } = require("@Helpers/jwt");

module.exports = async (req, res, next) => {
  try {
    const token = req.query.access_token || req.header("Authorization").replace("Bearer ", "");
    const payload = await verifyToken(token);
    if (payload) {
      let user = await findByID(payload.id);
      if (!!user) {
        if (user.status == UserModel.STATUS_ENUM.BLOCKED) {
          res.status(200).json({
            status: false,
            msg: ERROR_AUTH.USER_NOT_ACTIVE,
            code: "user_blocked"
          });
        }else {
          req.user = user;
          req.token = token;
          next();
        }
      } else {
        res.status(200).json({
          status: false,
          msg: ERROR_AUTH.NO_ACCESS,
          code: "get_user_err"
        });
      }
    } else {
      res.status(200).json({
        status: false,
        msg: ERROR_AUTH.TOKEN_INVALID,
        code: "err_payload"
      });
    }
  } catch (e) {
    res.status(200).json({
      status: false,
      msg: ERROR_AUTH.NO_ACCESS,
      code: "err_exception"
    });
  }
};
