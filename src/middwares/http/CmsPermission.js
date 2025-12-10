const { ERROR_AUTH } = require("@Helpers/contants");
const AdminAccount = require("@Models/Admin/AdminAccount");

const validatePerms = (permsRequired = [], userPerms = []) => {
  if (userPerms.length <= 0) return false;
  let isAllowNext = true;
  for (const permsReq of permsRequired) {
    const userP = userPerms.find(item => item.position === permsReq);
    if (userP) {
      if (userP.allow == true) { continue; } else { isAllowNext = false; break; }
    } else {
      isAllowNext = false; break;
    }
  };
  return isAllowNext;
};

module.exports = (permsRequired = []) => {
  if (typeof permsRequired === 'string') permsRequired = [permsRequired];
  return (req, res, next) => {
    // bỏ qua nếu user có role là root
    if (req.user.role == AdminAccount.AdminAccountModel.ROLE_ENUM.ROOT) return next();
    
    try {
      if (!Object.hasOwn(req.user, "account_permission")) return res.status(200).json({
        status: false,
        msg: ERROR_AUTH.NO_ACCESS,
        code: "err_missing_account_permission"
      });

      const userRolePerms = req.user.account_permission;
      const allowAccess = validatePerms(permsRequired, userRolePerms);

      if (!allowAccess) return res.status(200).json({
        status: false,
        msg: ERROR_AUTH.NO_ACCESS,
        code: "permission_required"
      });

      next();
    } catch (e) {
      // console.log(e);
      // ERRSOLE.error(new Error(e));
      return res.status(200).json({
        status: false,
        msg: ERROR_AUTH.NO_ACCESS,
        code: "err_exception"
      });
    }
  };
}

