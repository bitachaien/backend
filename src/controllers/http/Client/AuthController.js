const {
  ERROR_PAGE,
  ERROR_MESSAGES,
  ERROR_CODES,
  SUCCESS,
  ERROR_FORM,
  ERROR_AUTH,
  ERROR_AUTH_MESSAGE,
  UPDATE_SUCCESS_RESPONSE_TEXT
} = require("@Helpers/contants");
const { numberWithCommas } = require("@Helpers/helpers");
const { createToken, verifyToken } = require("@Helpers/jwt");
const { generatePassword, validatePassword, randomPassword } = require("@Helpers/password");
const { validateEmail } = require("@Helpers/email");
const { randomString } = require("@Helpers/String");
const validator = require("validator");
const moment = require("moment-timezone");
moment.tz.setDefault("Asia/Ho_Chi_Minh");
const redis = require("@Databases/redis");
const { UserDeviceModel } = require("@Models/User/UserDevice");
const { IpRegModel } = require("@Models/User/IpRegistered");
const { UserModel, findByUsername, findByEmail, findByPhoneNumber } = require("@Models/User/User");
const { PasswdSecurityModel } = require("@Models/Security/PasswdSecurity");
const { WithdrawConditionModel } = require("@Models/Withdraw/WithdrawCondition");
const userWithdrawCondion = require("@Configs/condition/userWithdraw.json");
const { AgencyModel, findByRefCode } = require("@Models/Agency/Agency");
const { AgencyRefModel } = require("@Models/Agency/AgencyRef");
const { MessageModel } = require("@Models/Message/Message");
const { VipModel } = require("@Models/Vip/Vip");
const { nodeSendMail, templateRequestPasswordReset } = require("@Plugins/MailService");
const TcgService = require("@Plugins/TcgService");
const { ApiConfigModel } = require("@Models/GameApi/ApiConfig");
const clientConfig = require("@Configs/game/clientConfig.json");
const teleBotSendMsg = require('@Plugins/TelegramBot');

module.exports = {
  login: async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password)
        return res.status(200).json({
          status: false,
          msg: ERROR_FORM.MISSING_FIELD
        });

      // if (captcha != req.session.captcha) {
      //   res.status(200).json({
      //     status: false,
      //     msg: ERROR_CODES.CaptchaInvalid
      //   });
      //   return;
      // }

      const user = await findByUsername(username);

      if (!user) {
        res.status(200).json({
          status: false,
          msg: ERROR_AUTH.LOGIN_FAIL
        });
        return;
      }

      if (validatePassword(password, user.password)) {

        if (user.status == UserModel.STATUS_ENUM.BLOCKED) {
          res.status(200).json({
            status: false,
            msg: ERROR_AUTH.USER_NOT_ACTIVE
          });
          return;
        }

        const userDocument = user.toJSON();
        delete userDocument.password;

        const botTeleConfig = require('@Configs/telegram/bot.json');
        const chatTeleConfig = require('@Configs/telegram/chatGroup.json');
        const messageTeleConfig = require('@Configs/telegram/message.json');

        // thông báo telegram
        if (botTeleConfig.status) {
          teleBotSendMsg(chatTeleConfig.userLogin, messageTeleConfig.userLogin, {
            '{{time}}': moment().format("HH:mm:ss DD/MM/YYYY"),
            '{{username}}': userDocument.username,
            '{{name}}': userDocument.name,
            '{{balance}}': numberWithCommas(userDocument.coin)
          });
        }

        res.status(200).json({
          status: true,
          msg: SUCCESS,
          data: userDocument,
          access_token: await createToken(userDocument.id),
          code: 200
        });
      } else {
        res.status(200).json({
          status: false,
          msg: ERROR_AUTH.LOGIN_FAIL,
          code: 1
        });
      }
    } catch (e) {
      console.log(e);
      res.status(200).json({
        status: false,
        msg: ERROR_CODES.SomeErrorsOccurredPleaseTryAgain,
        code: 500
      });
    }
  },
  register: async (req, res) => {
    try {
      const user = req.body;

      if (!user.username || !user.password)
        return res.status(200).json({
          status: false,
          msg: ERROR_FORM.MISSING_FIELD
        });

      if (
        user.name == null ||
        user.username == null ||
        user.email == null ||
        user.phone == null ||
        user.password == null ||
        user.name == "" ||
        user.username == "" ||
        user.email == "" ||
        user.phone == "" ||
        user.password == ""
      )
        return res.status(200).json({
          status: false,
          msg: ERROR_FORM.MISSING_FIELD
        });

      if (
        user.name.match(
          /^(([A-Za-z]+[\-\']?)*([A-Za-z]+)?\s)+([A-Za-z]+[\-\']?)*([A-Za-z]+)?$/
        ) == null
      )
        return res.status(200).json({
          status: false,
          msg: ERROR_AUTH_MESSAGE.InvalidName
        });
      if (!validator.isLength(user.name, { min: 4, max: 100 }))
        return res.status(200).json({
          status: false,
          msg: ERROR_MESSAGES.ErrorNameLength
        });
      if (user.username.match(/^[A-Za-z0-9_.]+$/) == null)
        return res.status(200).json({
          status: false,
          msg: ERROR_AUTH_MESSAGE.InvalidUsername
        });
      if (!validator.isLength(user.username, { min: 5, max: 20 }))
        return res.status(200).json({
          status: false,
          msg: ERROR_MESSAGES.ErrorUsernameLength
        });
      if (!validateEmail(user.email))
        return res.status(200).json({
          status: false,
          msg: ERROR_AUTH_MESSAGE.InvalidEmail
        });
      if (user.password.length < 6)
        return res.status(200).json({
          status: false,
          msg: ERROR_AUTH_MESSAGE.InvalidPasswordShort
        });
      if ((await findByUsername(user.username)) !== null)
        return res.status(200).json({
          status: false,
          msg: ERROR_AUTH_MESSAGE.UsernameExists
        });
      if ((await findByEmail(user.email)) !== null)
        return res.status(200).json({
          status: false,
          msg: ERROR_AUTH_MESSAGE.EmailExists
        });

      // Agency Validate
      if (user.refcode !== null) {
        if (user.refcode.match(/^[A-Za-z0-9_.]+$/) == null)
          return res.status(200).json({
            status: false,
            msg: ERROR_AUTH_MESSAGE.InvalidRefcode
          });

        const agency = await findByRefCode(user.refcode);

        if (!agency) {
          return res.status(200).json({
            status: false,
            msg: `${ERROR_AUTH_MESSAGE.AgencyNotFound}: ${user.refcode}`
          });
        }

        const findRoleAgency = await UserModel.findOne({
          where: {
            id: agency.uid
          },
          attributes: ["role"]
        });

        if (!findRoleAgency) {
          return res.status(200).json({
            status: false,
            msg: `${ERROR_AUTH_MESSAGE.AgencyNotFound}: ${user.refcode}`
          });
        }

        if (findRoleAgency.role !== UserModel.ROLE_ENUM.AGENCY) {
          return res.status(200).json({
            status: false,
            msg: `${ERROR_AUTH_MESSAGE.AgencyNotFound}: ${user.refcode}`
          });
        }
      }


      // đăng kí tài khoản
      user.name = user.name.toUpperCase();
      user.username = user.username.toLowerCase();
      user.phone = user.phone;
      user.email = user.email.toLowerCase();
      user.status = UserModel.STATUS_ENUM.ACTIVE;
      user.role = UserModel.ROLE_ENUM.USER;
      user.coin = 0;
      const passwordHash = generatePassword(user.password);
      user.password = passwordHash;
      user.code = randomString(6);
      user.verify = UserModel.VERIFY_ENUM.FALSE;
      const userSaved = await UserModel.create(user);
      //sendUseregister(userSaved.email, userSaved.code);
      await userSaved.reload();
      const userJSON = userSaved.toJSON();
      userJSON.verify = JSON.parse(userJSON.verify);
      userJSON.token = await createToken(userSaved.id);
      delete userJSON.code;
      delete userJSON.password;
      delete userJSON.deletedAt;

      // Agency Create
      const agencySaved = await AgencyModel.create({
        uid: userSaved.id,
        code: userSaved.username
      });
      await agencySaved.reload();
      const agencyJSON = agencySaved.toJSON();
      userJSON.agency = agencyJSON;

      // Agency Referer Create
      if (user.refcode !== null) {
        const agencyInfo = await findByRefCode(user.refcode);

        if (agencyInfo) {
          const agencyRefSaved = await AgencyRefModel.create({
            uid: userSaved.id,
            agency: agencyInfo.id
          });
          await agencyRefSaved.reload();
          const agencyRefJSON = agencyRefSaved.toJSON();
          const agencyData = await UserModel.findOne({
            where: { id: agencyInfo.uid },
            attributes: { exclude: ["deletedAt", "updatedAt", "isPlay", "code", "verify", "coin", "password", "phone", "email"] }
          });
          userJSON.agency_referer = agencyData;
        }
      }

      // create welcome message
      // MessageModel.create({
      //   uid: userSaved.id,
      //   type: MessageModel.TYPE_ENUM.USER,
      //   title: `【Khuyến mãi】 Xin chúc mừng! Bạn vừa giành giải thưởng【TẶNG 5% KHI NẠP TIỀN LẦN ĐẦU ATM,TRỰC TUYẾN 1】`,
      //   content: `Chúc mừng Quý Khách ${user.username} đã chiến thắng giải thưởng【TẶNG 0.5% KHI NẠP TIỀN LẦN ĐẦU ATM,TRỰC TUYẾN 1】. Chúc bạn thắng lớn tại【SHBET】!`,
      //   is_welcome: true
      // });

      // create password 2
      const getUserSecrPasswd = await PasswdSecurityModel.findPasswdByUserId(userSaved.id);
      if (!getUserSecrPasswd) PasswdSecurityModel.create({
        uid: userSaved.id,
        password: "12345" // default password
      });

      // create current vip level
      VipModel.create({
        uid: userSaved.id,
        vip_current: 0
      });

      // ip register
      await IpRegModel.create({
        uid: userSaved.id,
        ip: user.ip || ""
      });

      // Withdraw Condion
      userWithdrawCondion.uid = userSaved.id;
      await WithdrawConditionModel.create(userWithdrawCondion);

      // Create Account Tcgaming
      const listApiConfig = await ApiConfigModel.findAll();
      for (const ApiKey of listApiConfig) {
        const tcgService = new TcgService(ApiKey.api_config);
        tcgService.createUser(
          user.username,
          clientConfig.default_password
        );
      }

      return res.status(200).json({
        status: true,
        msg: SUCCESS,
        user: userJSON
      });
    } catch (e) {
      console.log(e);
      return res.status(200).json({
        status: false,
        msg: ERROR_CODES.SomeErrorsOccurredPleaseTryAgain,
        code: 500
      });
    }
  },
  me: async (req, res) => {
    try {
      const ipAdress = req.ip || req.ips || null;
      const userAgent = (!req.headers["user-agent"].includes("axios")) ? req.headers["user-agent"]: null;
      const user = req.user;

      if (ipAdress && userAgent) {
        try {
          const userDevice = await UserDeviceModel.findByID(user.id);
          if (!userDevice) {
            await UserDeviceModel.create({
              uid: user.id,
              ip: ipAdress,
              user_agent: userAgent,
              location: "",
              last_login: moment()
            });
          }else {
            userDevice.ip = ipAdress;
            userDevice.user_agent = userAgent;
            userDevice.location = "";
            userDevice.last_login = moment();
            await userDevice.save();
          }
        }catch(e) {
          console.log(e);
        }
      }

      // lấy tổng số dư tcg
      // if (user.isPlay == UserModel.IS_PLAY_ENUM.TRUE) {
      //   const tcgTotalBalance = await getTotalBalance(user.username);
      //   if (tcgTotalBalance.status) {
      //     // tcgTotalBalance.totalBalance
      //     await backupBalanceByUser(user.username);
      //   }
      // }

      const userDocument = req.user.toJSON();
      delete userDocument.password;
      res.status(200).json({
        status: true,
        msg: SUCCESS,
        user: userDocument,
        access_token: req.token,
        code: 200
      });
    } catch (e) {
      res.status(200).json({
        status: false,
        msg: ERROR_CODES.SomeErrorsOccurredPleaseTryAgain,
        code: 500
      });
    }
  },
  changePassword: async (req, res) => {
    try {
      const { oldPassword, newPassword } = req.body;
      const user = await findByUsername(req.user.username);
      if (!!user) {
        if (validatePassword(oldPassword, user.password)) {
          user.password = generatePassword(newPassword);
          await user.save();
          await user.reload();
          res.status(200).json({
            status: true,
            msg: SUCCESS,
            code: SUCCESS
          });
        } else {
          res.status(200).json({
            status: false,
            msg: ERROR_MESSAGES.ErrorOldPassword,
            code: "err_old_password"
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
  changePasswordSecurity: async (req, res) => {
    try {
      const { oldPassword, newPassword } = req.body;
      const user = await findByUsername(req.user.username);
      if (!!user) {
        const getUserSecrPasswd = await PasswdSecurityModel.findPasswdByUserId(req.user.id);
        if (getUserSecrPasswd) { // đã cập nhật 
          if (validatePassword(oldPassword, getUserSecrPasswd.password)) {
            getUserSecrPasswd.password = newPassword; // model đã có setter md5
            await getUserSecrPasswd.save();
            await getUserSecrPasswd.reload();
            res.status(200).json({
              status: true,
              msg: UPDATE_SUCCESS_RESPONSE_TEXT,
              code: SUCCESS
            });
          } else {
            res.status(200).json({
              status: false,
              msg: ERROR_MESSAGES.ErrorOldPassword,
              code: "err_old_password"
            });
          }
        } else { // chưa cập nhật 
          if (newPassword.length < 6)
            return res.status(200).json({
              status: false,
              msg: ERROR_AUTH_MESSAGE.InvalidPasswordShort
            });

          await PasswdSecurityModel.create({
            uid: req.user.id,
            password: newPassword
          });

          return res.status(200).json({
            status: false,
            msg: UPDATE_SUCCESS_RESPONSE_TEXT,
            code: SUCCESS
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
  checkSecurityPasswd: async (req, res) => {
    try {
      const getUserSecrPasswd = await PasswdSecurityModel.findPasswdByUserId(req.user.id);
      let isUpdated = false;
      if (getUserSecrPasswd) isUpdated = true;
      return res.status(200).json({
        status: true,
        isUpdated,
        msg: SUCCESS
      });
    } catch (e) {
      console.log(e);
      res.status(500).json({
        status: false,
        msg: ERROR_CODES.SomeErrorsOccurredPleaseTryAgain,
        code: 500
      });
    }
  },
  forgotPassword: async (req, res) => {
    try {
      const user = req.body;
      if (!user.username || !user.phone)
        return res.status(200).json({
          status: false,
          msg: ERROR_FORM.MISSING_FIELD
        });

      if (user.username == null || user.phone == null || user.username == "" || user.phone == "")
        return res.status(200).json({
          status: false,
          msg: ERROR_FORM.MISSING_FIELD
        });
      if (user.username.match(/^[A-Za-z0-9_.]+$/) == null)
        return res.status(200).json({
          status: false,
          msg: ERROR_AUTH_MESSAGE.InvalidUsername
        });
      if (!validator.isLength(user.username, { min: 5, max: 20 }))
        return res.status(200).json({
          status: false,
          msg: ERROR_AUTH_MESSAGE.InvalidUsername
        });
      const userCheck = await findByUsername(user.username);
      if (!userCheck)
        return res.status(200).json({
          status: false,
          msg: ERROR_CODES.AccountNotFound
        });
      const phoneCheck = await findByPhoneNumber(user.phone);
      if (!phoneCheck)
        return res.status(200).json({
          status: false,
          msg: ERROR_CODES.PhoneNotFound
        });

      const redisKey = `forgetPassword:${user.username}`;

      const checkRedis = await redis.get(redisKey);

      if (!checkRedis) {
        // create logic
        const newPasswordChanged = randomPassword(13);
        phoneCheck.password = generatePassword(newPasswordChanged);
        await phoneCheck.save();
        await phoneCheck.reload();

        /*** send email ***/
        await nodeSendMail(phoneCheck.email, ERROR_AUTH.RequestPasswordReset, templateRequestPasswordReset(phoneCheck.username, newPasswordChanged));
        redis.setex(redisKey, 300, {
          timeCreated: moment().format("X"),
          newPassword: newPasswordChanged
        });
        return res.status(200).json({
          status: true,
          msg: SUCCESS
        });
      } else {
        // has not expired yet
        return res.status(200).json({
          status: false,
          msg: ERROR_MESSAGES.ErrorHasNotExpiredYet
        });
      }
    } catch (e) {
      console.log(e);
      res.status(200).json({
        status: false,
        msg: ERROR_CODES.SomeErrorsOccurredPleaseTryAgain,
        code: 500
      });
    }
  }
};
