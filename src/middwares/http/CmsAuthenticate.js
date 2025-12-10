const { ERROR_AUTH } = require("@Helpers/contants");
const AdminAccount = require("@Models/Admin/AdminAccount");
const AdminPerm = require("@Models/Admin/AdminPermission");
const { verifyToken } = require("@Helpers/jwt");

module.exports = async (req, res, next) => {
  try {
    let token = req.query.access_token;
    
    if (!token && req.header("Authorization")) {
      const authHeader = req.header("Authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.replace("Bearer ", "");
      }
    }

    if (!token) {
      return res.status(200).json({
        status: false,
        msg: ERROR_AUTH.TOKEN_INVALID,
        code: "err_missing_token"
      });
    }

    const payload = await verifyToken(token);

    if (!payload) return res.status(200).json({
      status: false,
      msg: ERROR_AUTH.TOKEN_INVALID,
      code: "err_payload"
    });

    let user = await AdminAccount.AdminAccountModel.findOne({
      where: {
        id: payload.id,
        status: AdminAccount.AdminAccountModel.STATUS_ENUM.ACTIVE
      },
      include: [
        {
          model: AdminPerm.AdminPermModel,
          as: "account_permission"
        }
      ]
    });

    if (!user) return res.status(200).json({
      status: false,
      msg: ERROR_AUTH.NO_ACCESS,
      code: "get_user_err"
    });

    req.user = user;
    req.token = token;
    next();
  } catch (e) {
    console.log(e)
    return res.status(200).json({
      status: false,
      msg: ERROR_AUTH.NO_ACCESS,
      code: "err_exception"
    });
  }
};
