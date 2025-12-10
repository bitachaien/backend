const {
  ERROR_PAGE,
  ERROR_FORM,
  ERROR_AUTH,
  ERROR_AUTH_MESSAGE,
  ERROR_MESSAGES
} = require("@Helpers/contants");
const { createToken, verifyToken } = require("@Helpers/jwt");
const { generatePassword, validatePassword } = require("@Helpers/password");
const AdminAccount = require("@Models/Admin/AdminAccount");
const { AdminPasswdSecurityModel } = require("@Models/Admin/AdminPasswdSecurity");

module.exports = {
  login: async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password)
        return res.status(200).json({
          status: false,
          msg: ERROR_FORM.MISSING_FIELD
        });

      const user = await AdminAccount.findByUsername(username);

      if (!user) return res.status(200).json({
        status: false,
        msg: ERROR_AUTH.LOGIN_FAIL
      });

      if (validatePassword(password, user.password)) {
        const userDocument = user.toJSON();
        delete userDocument.password;

        if (user.status == AdminAccount.AdminAccountModel.STATUS_ENUM.BLOCKED) return res.status(200).json({
          status: false,
          msg: ERROR_AUTH.USER_NOT_ACTIVE,
          code: 1
        });

        return res.status(200).json({
          status: true,
          msg: "success",
          data: userDocument,
          access_token: await createToken(userDocument.id),
          code: 200
        });
      } else {
        return res.status(200).json({
          status: false,
          msg: ERROR_AUTH.LOGIN_FAIL,
          code: 1
        });
      }
    } catch (e) {
      console.log(e);
      return res.status(200).json({
        status: false,
        msg: e.message,
        code: 500
      });
    }
  },
  me: async (req, res) => {
    try {
      const userDocument = req.user.toJSON();
      // console.log(userDocument);
      delete userDocument.password;

      return res.status(200).json({
        status: true,
        msg: "success",
        user: userDocument,
        access_token: req.token,
        code: 200
      });
    } catch (e) {
      return res.status(200).json({
        status: false,
        msg: e.message,
        code: 500
      });
    }
  },
  changePassword: async (req, res) => {
    try {
      const { oldPassword, newPassword } = req.body;
      const user = await AdminAccount.findByUsername(req.user.username);

      if (validatePassword(oldPassword, user.password)) {
        user.password = generatePassword(newPassword);
        await user.save();
        await user.reload();
        return res.status(200).json({
          status: true,
          msg: "success",
          code: "success"
        });
      } else {
        return res.status(200).json({
          status: false,
          msg: "Mật khẩu cũ không đúng",
          code: "err_old_password"
        });
      }
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        status: false,
        msg: e.message,
        code: 500
      });
    }
  },
  changePasswordSecurity: async (req, res) => {
    try {
      const { oldPassword, newPassword } = req.body;
      const user = await AdminAccount.findByUsername(req.user.username);
      if (!!user) {
        const getUserSecrPasswd = await AdminPasswdSecurityModel.findPasswdByUserId(req.user.id);
        if (getUserSecrPasswd) { // đã cập nhật 
          if (validatePassword(oldPassword, getUserSecrPasswd.password)) {
            getUserSecrPasswd.password = newPassword; // model đã có setter md5
            await getUserSecrPasswd.save();
            await getUserSecrPasswd.reload();
            res.status(200).json({
              status: true,
              msg: "Cập nhật mật khẩu cấp 2 thành công!",
              code: "success"
            });
          } else {
            res.status(200).json({
              status: false,
              msg: "Mật khẩu cũ không đúng!",
              code: "err_old_password"
            });
          }
        } else { // chưa cập nhật 
          return res.status(200).json({
            status: false,
            msg: "Mật khẩu cấp 2 chưa được thiết lập!",
            code: "err_pass_not_init"
          });
        }
      }
    } catch (e) {
      console.log(e);
      res.status(500).json({
        status: false,
        msg: ERROR_CODES.SomeErrorsOccurredPleaseTryAgain,
        code: 500
      });
    }
  },
};
