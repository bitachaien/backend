const fs = require('fs');
const moment = require("moment-timezone");
moment.tz.setDefault("Asia/Ho_Chi_Minh");
const { Op } = require("sequelize");
const md5 = require("md5");
const {
  SUCCESS,
  ERROR_PAGE,
  ERROR_FORM,
  ERROR_AUTH,
  ERROR_AUTH_MESSAGE,
  ERROR_MESSAGES,
  ERROR_CODES,
  PAYMENT_MESSAGE
} = require("@Helpers/contants");
const Helper = require("@Helpers/helpers");
const { validatePassword } = require("@Helpers/password");
const { parseInt } = require("@Helpers/Number");
const { numberWithCommas } = require("@Helpers/helpers");
const { randomString } = require("@Helpers/String");
const { BankListModel } = require("@Models/Bank/BankList");
const { BankHistoryModel } = require("@Models/Bank/BankHistory");
const BankListDeposit = require("@Configs/payment/BankDeposit.json");
const BankWithdraw = require("@Configs/payment/BankWithdraw.json");
const { BetHistoryModel } = require("@Models/Bet/BetHistory");
const { CardHistoryModel } = require("@Models/Card/CardHistory");
const { BankUserModel } = require("@Models/Bank/BankUser");
const { PasswdSecurityModel } = require("@Models/Security/PasswdSecurity");
const { WithdrawConditionModel } = require("@Models/Withdraw/WithdrawCondition");
const { findByID, UserModel } = require("@Models/User/User");
const paymentAutoService = require('@Plugins/PaymentService');
const fastpayConfig = require('@Configs/payment/autoGateBank.json');

const FASTPAY_SUCCESS_CODE = 1;
const FASTPAY_ERROR_RESPONSE = '-1|failed';
const FASTPAY_SUCCESS_RESPONSE = '1|success';

const DEFAULT_HISTORY_DAYS = 30;

const formatFastPayClientResponse = (data = {}) => {
  return {
    bank: data.bank || data.bankCode || "",
    bankCode: data.bankCode || data.bank || "",
    bankName: data.bankName || "",
    bankAccount: data.bankAccount || "",
    content: data.content || "",
    amount: Number(data.amount || 0),
    qrImageUrl: data.qrImageUrl || data.payment_url || data.linkWebView || "",
    qr_data: data.qr_data || data.qrCode || "",
    payment_url: data.payment_url || data.linkWebView || "",
    linkOpenApp: data.linkOpenApp || "",
    linkWebView: data.linkWebView || ""
  };
};

const createFastPayHistoryRecord = async (uid, bankCode, fastPayData, transId, amount) => {
  return BankHistoryModel.create({
    uid,
    bankProvide: bankCode,
    bankNumber: fastPayData.bankAccount || "",
    bankName: fastPayData.bankName || fastPayData.bank || "",
    transId,
    type: BankHistoryModel.TYPE_ENUM.RECHARGE,
    amount: Number(amount),
    info: `FastPay transfer ${bankCode} / ${(fastPayData.bankName || fastPayData.bank || "").toUpperCase()}`,
    status: BankHistoryModel.STATUS_ENUM.PROCESSING
  });
};

const parseFastPayResponseContent = (content) => {
  if (!content) return null;
  if (typeof content === "string") {
    try {
      return JSON.parse(content);
    } catch (e) {
      return null;
    }
  }
  return content;
};
const teleBotSendMsg = require('@Plugins/TelegramBot');
const BalanceFluct = require("@Models/User/BalanceFluct");
const { MiniTaixiuUserModel } = require("@Models/Game/MiniTaiXiu/User");
const { XocXocUserModel } = require("@Models/Game/XocXoc/User");
const { BetRefurnModel } = require("@Models/Bet/BetRefurn");

module.exports = {
  getListManualBank: async (req, res) => {
    const List = await BankListModel.findAll({
      status: BankListModel.STATUS_ENUM.ACTIVE
    });
    return res.status(200).json({
      status: true,
      data: List,
      msg: "Success"
    });
  },
  getListBankDeposit: async (req, res) => {
    try {
      return res.status(200).json({
        status: true,
        data: BankWithdraw,
        msg: "Success"
      });
    } catch (e) {
      console.log(e);
      return res.status(200).json({
        status: false,
        data: [],
        msg: "Error Get List Bank Deposit"
      });
    }
  },
  getListBankWithdraw: async (req, res) => {
    try {
      return res.status(200).json({
        status: true,
        data: BankWithdraw,
        msg: SUCCESS
      });
    } catch (e) {
      console.log(e);
      return res.status(200).json({
        status: false,
        data: [],
        msg: ERROR_CODES.SomeErrorsOccurredPleaseTryAgain
      });
    }
  },
  getDataRequestManualBank: async (req, res) => {
    const { id } = req.params;
    if (!id) {
      return res.status(200).json({
        status: false,
        msg: "Missing Param Bank ID"
      });
    }
    if (!Number(id) >> 0) {
      return res.status(200).json({
        status: false,
        msg: "Err Bank ID"
      });
    }
    const bank = await BankListModel.findOne({ where: { id } });

    if (!!bank) {
      const BankRequestData = bank.toJSON();
      BankRequestData.content = "NAP " + req.user.username.toUpperCase();

      return res.status(200).json({
        status: true,
        data: BankRequestData,
        msg: "Success"
      });
    } else {
      return res.status(200).json({
        status: false,
        msg: "Bank not found"
      });
    }
  },
  createRequestManualBank: async (req, res) => {
    try {
      const {
        bank,
        bankDeposit,
        nameDeposit,
        numberDeposit,
        amountDeposit,
        transIdDeposit
      } = req.body;

      if (Number(amountDeposit) < 50000) {
        return res.status(200).json({
          status: false,
          msg: "Minimum deposit amount must be more than 50,000"
        });
      }

      const createDepositRequest = await BankHistoryModel.create({
        uid: req.user.id,
        bankProvide: bankDeposit,
        bankNumber: numberDeposit,
        bankName: nameDeposit,
        transId: transIdDeposit,
        type: BankHistoryModel.TYPE_ENUM.RECHARGE,
        amount: Number(amountDeposit),
        info: `Bank transfer ${bank}`,
        status: BankHistoryModel.STATUS_ENUM.PENDING
      });
      if (!!createDepositRequest) {
        return res.status(200).json({
          status: true,
          data: [],
          msg: "Deposit request created successfully!"
        });
      } else {
        return res.status(200).json({
          status: false,
          msg: "Error Insert Request Deposit!"
        });
      }
    } catch (e) {
      console.log(e);
      return res.status(200).json({
        status: false,
        msg: "Error Create Request Deposit!"
      });
    }
  },
  userAddBank: async (req, res) => {
    try {
      let { bankProvide, bankName, bankNumber, bankBranch } = req.body;

      const bankUser = await BankUserModel.findOne({
        where: { uid: req.user.id }
      });
      if (bankUser) {
        return res.status(200).json({
          status: true,
          data: [],
          msg: PAYMENT_MESSAGE.ACCOUNT_UNIQUE_BANK_ACCOUNT
        });
      }

      bankProvide = bankProvide.toUpperCase();
      bankName = bankName.toUpperCase();
      bankBranch = bankBranch.toUpperCase();

      const createBankUser = await BankUserModel.create({
        uid: req.user.id,
        bankProvide,
        bankNumber,
        bankName,
        bankBranch,
        status: BankUserModel.STATUS_ENUM.ACTIVE
      });

      if (!!createBankUser) {
        return res.status(200).json({
          status: true,
          data: [],
          msg: PAYMENT_MESSAGE.USER_BANK_ADDED
        });
      } else {
        return res.status(200).json({
          status: false,
          msg: PAYMENT_MESSAGE.ERROR_USER_BANK_ADDED
        });
      }
    } catch (e) {
      console.log(e);
      return res.status(200).json({
        status: false,
        msg: ERROR_CODES.SomeErrorsOccurredPleaseTryAgain
      });
    }
  },
  getListUserBank: async (req, res) => {
    const userBankList = await BankUserModel.findAll({
      where: {
        uid: req.user.id,
        status: BankUserModel.STATUS_ENUM.ACTIVE
      },
      order: [["id", "DESC"]]
    });
    return res.status(200).json({
      status: true,
      data: userBankList,
      msg: SUCCESS
    });
  },
  createRequestWithdraw: async (req, res) => {
    try {
      const { bankName, bankNumber, bankProvide, amount, passwd } = req.body;

      if (Number(amount) < 100000) {
        return res.status(200).json({
          status: false,
          msg: Helper.replaceText(PAYMENT_MESSAGE.MINIMUN_WITHDRAWAL_AMOUNT, { "{{amount}}": "100.000" })
        });
      }

      if (Number(amount) >= 500000000) {
        return res.status(200).json({
          status: false,
          msg: Helper.replaceText(PAYMENT_MESSAGE.MAXIMUM_WITHDRAWAL_AMOUNT, { "{{amount}}": "500.000.000" })
        });
      }

      const user = await findByID(req.user.id);

      if (user.coin < Number(amount)) {
        return res.status(200).json({
          status: false,
          msg: PAYMENT_MESSAGE.BALANCE_ENOUGHT
        });
      }

      // const getUserSecrPasswd = await PasswdSecurityModel.findPasswdByUserId(req.user.id);
      // if (!getUserSecrPasswd) {
      //   return res.status(200).json({
      //     status: false,
      //     msg: PAYMENT_MESSAGE.NOT_HAVE_SECURITY_PASSWORD
      //   });
      // }

      // if (!validatePassword(passwd, getUserSecrPasswd.password)) {
      //   return res.status(200).json({
      //     status: false,
      //     msg: PAYMENT_MESSAGE.PASSWORD_SECURITY_INCORRECT
      //   });
      // }

      // let totalDeposit = 0;
      // const getTotalDeposit = await BankHistoryModel.findAll({
      //   where: {
      //     uid: req.user.id,
      //     status: BankHistoryModel.STATUS_ENUM.SUCCESS,
      //     type: BankHistoryModel.TYPE_ENUM.RECHARGE
      //   },
      //   attributes: ["amount"]
      // });
      // for (const deposit of getTotalDeposit) totalDeposit += deposit.amount;


      // if (Number(amount) > totalDeposit) {
      //   return res.status(200).json({
      //     status: false,
      //     msg: ERROR_CODES.SomeErrorsOccurredPleaseTryAgain
      //   });
      // }

      // let totalWithdraw = 0;
      // const getTotalWithdraw = await BankHistoryModel.findAll({
      //   where: {
      //     uid: req.user.id,
      //     status: BankHistoryModel.STATUS_ENUM.SUCCESS,
      //     type: BankHistoryModel.TYPE_ENUM.CASHOUT
      //   },
      //   attributes: ["amount"]
      // });
      // for (const withdraw of getTotalWithdraw) totalWithdraw += withdraw.amount;

      // if (totalWithdraw > totalDeposit) {
      //   return res.status(200).json({
      //     status: false,
      //     msg: ERROR_CODES.SomeErrorsOccurredPleaseTryAgain
      //   });
      // }

      // đièều kiện rút
      const userBetRecord = await BetHistoryModel.findAll({ where: [{ uid: req.user.id }] });
      if (!userBetRecord) return res.status(200).json({
        status: false,
        msg: PAYMENT_MESSAGE.NOT_TRANSACTION_BET_FOUND
      });

      const userConditionWithdraw = await WithdrawConditionModel.findByUserId(req.user.id);
      if (!userConditionWithdraw) return res.status(200).json({
        status: false,
        msg: ERROR_CODES.SomeErrorsOccurredPleaseTryAgain
      });

      if (userBetRecord.length < userConditionWithdraw.minimumNumbOfBet) return res.status(200).json({
        status: false,
        msg: PAYMENT_MESSAGE.NEED_TO_PLAY_ENOUGH
      });

      let totalPlay = 0;
      // total bet game api
      for (const beted of userBetRecord) totalPlay += Number(beted.validBetAmount);
      totalPlay = totalPlay * 1000;
      // total bet minigame
      const userTx = await MiniTaixiuUserModel.findOne({ where: { uid: req.user.id } });
      const userXocXoc = await XocXocUserModel.findOne({ where: { uid: req.user.id } });
      if (userTx) totalPlay += userTx.total_bet;
      if (userXocXoc) totalPlay += userXocXoc.total_bet;

      // cộng thêm tiền hoàn
      const userBetRefurn = await BetRefurnModel.findAll({ where: { uid: req.user.id } });
      for (const betRefurned of userBetRefurn) totalPlay += Number(betRefurned.amountReturn);

      // check điều kiện
      if ((totalPlay) < userConditionWithdraw.totalMinimumBetAmount) return res.status(200).json({
        status: false,
        msg: PAYMENT_MESSAGE.NEED_TO_PLAY_ENOUGH_MONEY
      });


      // Giới hạn rút tiền mỗi tài khoản chỉ được rút tối đa 3 lần/ngày (min 100k max 500tr)
      const getHistoryBankWithdrawToday = await BankHistoryModel.findAll({
        where: {
          uid: req.user.id,
          type: BankHistoryModel.TYPE_ENUM.CASHOUT,
          createdAt: {
            [Op.between]: [moment().startOf("days").format(), moment().endOf("days").format()]
          }
        }
      });

      if (getHistoryBankWithdrawToday > 3) return res.status(200).json({
        status: false,
        msg: PAYMENT_MESSAGE.USER_CAN_WITHDRAW_3_TIMES_ON_DAY
      });

      ///const balanceTcgRecovery = await resetBalanceToZero(user.username);
      user.coin -= Number(amount);
      //user.isPlay = UserModel.IS_PLAY_ENUM.FALSE;
      await user.save();
      await user.reload();


      const botTeleConfig = JSON.parse(fs.readFileSync(process.env.PWD + "/src/configs/telegram/bot.json", "utf8"));
      const chatTeleConfig = JSON.parse(fs.readFileSync(process.env.PWD + "/src/configs/telegram/chatGroup.json", "utf8"));
      const messageTeleConfig = JSON.parse(fs.readFileSync(process.env.PWD + "/src/configs/telegram/message.json", "utf8"));

      // thông báo telegram
      if (botTeleConfig.status) {
        const time = moment().format("DD/MM/YYYY HH:MM:ss");
        const username = req.user.username;
        const name = req.user.name;
        const phone = req.user.phone;
        const email = req.user.email;
        const amount2 = Helper.numberWithCommas(Number(amount));
        const trans_id = "Đang chờ...";
        const chargeTypeProvide = "BANK";
        const chargeTypeProvideVi = "Ngân hàng";
        const chargeTypeCode = bankProvide.toUpperCase();

        teleBotSendMsg(chatTeleConfig.paymentWithdraw, messageTeleConfig.paymentWithdraw, {
          '{{time}}': time,
          '{{username}}': username,
          '{{name}}': name,
          '{{phone}}': phone,
          '{{email}}': email,
          '{{amount}}': amount2,
          '{{balance}}': Helper.numberWithCommas(user.coin),
          '{{transId}}': trans_id,
          '{{chargeTypeProvide}}': chargeTypeProvide,
          '{{chargeTypeProvideVi}}': chargeTypeProvideVi,
          '{{chargeTypeCode}}': chargeTypeCode
        });
      }

      let isFirstWithdraw = false;
      const withdrawBank = await BankHistoryModel.findAll({
        where: {
          uid: user.id,
          type: BankHistoryModel.TYPE_ENUM.CASHOUT,
          status: BankHistoryModel.STATUS_ENUM.SUCCESS
        }
      });
      if (withdrawBank.length == 0) isFirstWithdraw = true;

      const createWithdrawRequest = await BankHistoryModel.create({
        uid: req.user.id,
        bankProvide: bankProvide,
        bankNumber: bankNumber,
        bankName: bankName,
        transId: Helper.getRandomInt(10000000, 99999999),
        type: BankHistoryModel.TYPE_ENUM.CASHOUT,
        amount: Number(amount),
        info: `Withdraw ${numberWithCommas(
          Number(amount)
        )} to the bank ${bankProvide} / ${bankNumber}`,
        status: BankHistoryModel.STATUS_ENUM.PENDING,
        is_first: isFirstWithdraw
      });

      if (!!createWithdrawRequest) {

        // create balance fluctuation
        await BalanceFluct.createBalaceFluct(
          createWithdrawRequest.uid,
          BalanceFluct.BalanceFluctModel.ACTION_ENUM.WITHDRAW,
          BalanceFluct.BalanceFluctModel.TYPE_ENUM.MINUS,
          Number(amount),
          user.coin,
          `Rút tiền về ngân hàng ${createWithdrawRequest.bankProvide.toUpperCase()} - ${Helper.numberWithCommas(amount)}`
        );

        try {
          sse.emitData(sse.GROUP_ENUMS.ADMINS, "clients", {
            type: "withdraw",
            data: {
              user,
              isFirst: isFirstWithdraw,
              transaction: createWithdrawRequest
            }
          }, true, null);
          
        } catch (e) {
          console.log(e);
        }

        return res.status(200).json({
          status: true,
          data: [],
          user,
          msg: PAYMENT_MESSAGE.CREATE_SUCCESS_REQUEST_WITHDRAW
        });
      } else {
        return res.status(200).json({
          status: false,
          msg: PAYMENT_MESSAGE.ERROR_CREATE_REQUEST_WITHDRAW
        });
      }
    } catch (e) {
      console.log(e);
      return res.status(200).json({
        status: false,
        msg: ERROR_CODES.SomeErrorsOccurredPleaseTryAgain
      });
    }
  },
  transactionHistory: async (req, res) => {
    try {
      const page = parseInt(req.query.page, true)
        ? parseInt(req.query.page, true)
        : 0;
      const kmess = parseInt(req.query.limit, true)
        ? parseInt(req.query.limit, true)
        : 0;

      if (!!page && !!kmess) {
        let match = {};
        match.uid = req.user.id;
        const defaultFrom = moment().subtract(DEFAULT_HISTORY_DAYS - 1, "days").format("DD/MM/YYYY");
        const from = (req.query.from) ? req.query.from : defaultFrom;
        const to = (req.query.to) ? req.query.to : moment().format("DD/MM/YYYY");
        match.createdAt = {
          [Op.between]: [moment(from, "DD/MM/YYYY").startOf("days").format(), moment(to, "DD/MM/YYYY").endOf("days").format()]
        };

        // filter
        if (!!req.query.type) {
          match.type = req.query.type;
        }

        if (!!req.query.bankName) {
          match.bankName = { [Op.like]: `%${req.query.bankName}%` };
        }
        if (!!req.query.bankProvide) {
          match.bankProvide = { [Op.like]: `%${req.query.bankProvide}%` };
        }
        if (!!req.query.bankNumber) {
          match.bankNumber = { [Op.like]: `%${req.query.bankNumber}%` };
        }
        if (!!req.query.transId) {
          match.transId = req.query.transId;
        }
        if (!!req.query.amount) {
          match.amount = req.query.amount;
        }
        if (!!req.query.status) {
          match.status = req.query.status;
        }

        const total = await BankHistoryModel.count({ where: match });

        const getData = await BankHistoryModel.findAll({
          where: match,
          offset: 0 + (page - 1) * kmess,
          limit: kmess,
          order: [["id", "DESC"]],
          attributes: { exclude: ["deletedAt"] }
        });

        res.status(200).json({
          status: true,
          data: {
            dataExport: getData,
            page: page,
            kmess: kmess,
            total: total
          },
          msg: "SUCCESS"
        });
      } else {
        res.status(200).json({
          status: false,
          msg: ERROR_FORM.MISSING_FIELD
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
  transactionHistoryCard: async (req, res) => {
    try {
      const page = parseInt(req.query.page, true)
        ? parseInt(req.query.page, true)
        : 0;
      const kmess = parseInt(req.query.limit, true)
        ? parseInt(req.query.limit, true)
        : 0;

      if (!!page && !!kmess) {
        let match = {};
        match.uid = req.user.id;
        const defaultFrom = moment().subtract(DEFAULT_HISTORY_DAYS - 1, "days").format("DD/MM/YYYY");
        const from = (req.query.from) ? req.query.from : defaultFrom;
        const to = (req.query.to) ? req.query.to : moment().format("DD/MM/YYYY");
        match.createdAt = {
          [Op.between]: [moment(from, "DD/MM/YYYY").startOf("days").format(), moment(to, "DD/MM/YYYY").endOf("days").format()]
        };

        // filter
        if (!!req.query.type) {
          match.type = req.query.type;
        }

        if (!!req.query.network) {
          match.network = { [Op.like]: `%${req.query.network}%` };
        }
        if (!!req.query.pin) {
          match.pin = { [Op.like]: `%${req.query.pin}%` };
        }
        if (!!req.query.seri) {
          match.seri = { [Op.like]: `%${req.query.seri}%` };
        }
        if (!!req.query.transId) {
          match.transId = req.query.transId;
        }
        if (!!req.query.amount) {
          match.amount = req.query.amount;
        }
        if (!!req.query.status) {
          match.status = req.query.status;
        }
        const total = await CardHistoryModel.count({ where: match });

        const getData = await CardHistoryModel.findAll({
          where: match,
          offset: 0 + (page - 1) * kmess,
          limit: kmess,
          order: [["id", "DESC"]],
          attributes: { exclude: ["deletedAt"] }
        });

        res.status(200).json({
          status: true,
          data: {
            dataExport: getData,
            page: page,
            kmess: kmess,
            total: total
          },
          msg: "SUCCESS"
        });
      } else {
        res.status(200).json({
          status: false,
          msg: ERROR_FORM.MISSING_FIELD
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
  getWithdrawalConditions: async (req, res) => {
    try {
      let totalDeposit = 0, totalBetValid = 0;

      const getTotalDeposit = await BankHistoryModel.findAll({
        where: {
          uid: req.user.id,
          status: BankHistoryModel.STATUS_ENUM.SUCCESS,
          type: BankHistoryModel.TYPE_ENUM.RECHARGE
        },
        attributes: ["amount"]
      });
      for (const deposit of getTotalDeposit) totalDeposit += deposit.amount;

      const getTotalBetValid = await BetHistoryModel.findAll({
        where: {
          uid: req.user.id
        },
        attributes: ["validBetAmount"]
      });
      for (const bet of getTotalBetValid) totalBetValid += bet.validBetAmount;
      totalBetValid = totalBetValid * 1000;

      return res.status(200).json({
        status: true,
        totalDeposit,
        totalBetValid,
        msg: "Success"
      });
    } catch (e) {
      console.log(e);
      res.status(200).json({
        status: false,
        msg: ERROR_CODES.SomeErrorsOccurredPleaseTryAgain,
        code: 500
      });
    }
  },
  Action: {
    getActiveAutoService: async (req, res) => {
      const getBankAvailable = await paymentAutoService.getListBankCode();
      if (getBankAvailable.status === true) {
        const arrBankList = [];
        (getBankAvailable.data || []).forEach(bank => {
          const code = (bank.code || bank.BankName || bank.bankCode || "").toUpperCase();
          const readableName = bank.name || bank.Name || bank.BankName || "";
          if (!code) return;
          arrBankList.push({
            code,
            shortname: bank.shortname || readableName,
            name: readableName
          });
        });
        return res.status(200).json({
          status: true,
          data: arrBankList,
          msg: SUCCESS
        });
      } else {
        return res.status(200).json({
          status: false,
          msg: getBankAvailable.msg || "Error get auto bank list"
        });
      }
    },
    createRequestAutoBank2: async (req, res) => {
      try {
        const { subType, bankCode, amount } = req.body;
        if (!amount) {
          return res.json({
            status: false,
            msg: ERROR_FORM.MISSING_FIELD
          });
        }

        const selectedBankCode = String(bankCode || subType || "").toUpperCase();

        if (!selectedBankCode) {
          return res.status(200).json({
            status: false,
            msg: "Vui lòng chọn ngân hàng muốn nạp!"
          });
        }

        if (Number(amount) < 50000) {
          return res.status(200).json({
            status: false,
            msg: "Số tiền nạp tối thiểu là 50,000!"
          });
        }

        const transId = Helper.getRandomInt(10000000, 99999999);
        const createRequest = await paymentAutoService.createRequest(transId, amount, selectedBankCode);

        if (createRequest.status === true) {
          const fastPayData = formatFastPayClientResponse(createRequest.data);
          const createDepositRequest = await createFastPayHistoryRecord(
            req.user.id,
            selectedBankCode,
            fastPayData,
            transId,
            amount
          );

          if (!!createDepositRequest) {
            return res.json({
              status: true,
              data: fastPayData,
              msg: SUCCESS
            });
          } else {
            return res.status(200).json({
              status: false,
              msg: "Error Create Request Deposit!"
            });
          }
        } else {
          return res.status(200).json({
            status: false,
            msg: createRequest.msg
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
    createRequestAutoBank: async (req, res) => {
      try {
        const { amount, bankCode, subType } = req.body;
        if (!amount) {
          return res.json({
            status: false,
            msg: ERROR_FORM.MISSING_FIELD
          });
        }

        const selectedBankCode = String(bankCode || subType || "").toUpperCase();

        if (!selectedBankCode) {
          return res.status(200).json({
            status: false,
            msg: "Vui lòng chọn ngân hàng muốn nạp!"
          });
        }

        if (Number(amount) < 10000) {
          return res.status(200).json({
            status: false,
            msg: "Số tiền nạp tối thiểu là 10,000!"
          });
        }

        const transId = String(Helper.getRandomInt(10000000, 99999999));
        const createRequest = await paymentAutoService.createRequest(transId, amount, selectedBankCode);

        if (createRequest.status === true) {
          const fastPayData = formatFastPayClientResponse(createRequest.data);
          const createDepositRequest = await createFastPayHistoryRecord(
            req.user.id,
            selectedBankCode,
            fastPayData,
            transId,
            amount
          );

          if (!!createDepositRequest) {
            return res.json({
              status: true,
              data: fastPayData,
              msg: SUCCESS
            });
          } else {
            return res.status(200).json({
              status: false,
              msg: "Error Create Request Deposit!"
            });
          }
        } else {
          return res.status(200).json({
            status: false,
            msg: createRequest.msg
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
    createRequestAutoWallet: async (req, res) => {
      const { subType, amount } = req.body;
      if (!subType || !amount) {
        return res.json({
          status: false,
          msg: ERROR_FORM.MISSING_FIELD
        });
      }

      // Với logic 1:1000, frontend gửi amount đã nhân 1000, nên kiểm tra >= 100000 (tương đương 100 từ frontend)
      if (Number(amount) < 100000) {
        return res.status(200).json({
          status: false,
          msg: "Số tiền nạp tối thiểu là 100.000 VND"
        });
      }

      const transId = String(Helper.getRandomInt(10000000, 99999999));
      // Sử dụng FastPay với bankCode = "MOMO"
      const bankCode = "MOMO";
      const createRequest = await paymentAutoService.createRequest(transId, amount, bankCode);

      if (createRequest.status === true) {
        const fastPayData = formatFastPayClientResponse(createRequest.data);
        const createDepositRequest = await createFastPayHistoryRecord(
          req.user.id,
          bankCode,
          fastPayData,
          transId,
          amount
        );

        if (!!createDepositRequest) {
          return res.json({
            status: true,
            data: fastPayData,
            msg: SUCCESS
          });
        } else {
          return res.status(200).json({
            status: false,
            msg: "Error Create Request Deposit!"
          });
        }
      } else {
        return res.status(200).json({
          status: false,
          msg: createRequest.msg
        });
      }
    },
    getActiveAutoCardService: async (req, res) => {
      const getCardAvailable = paymentAutoService.getCardData();
      res.json(getCardAvailable);
    },
    createRequestAutoCard: async (req, res) => {
      const { network, amount, pin, seri } = req.body;
      if (!network || !amount || !pin || !seri) {
        return res.json({
          status: false,
          msg: ERROR_FORM.MISSING_FIELD
        });
      }

      if (Number(amount) < 10000) {
        return res.status(200).json({
          status: false,
          msg: "Số tiền nạp tối thiểu phải lớn hơn 10.000 VND"
        });
      }

      const mapNetwork = paymentAutoService.mapCardCode(network, true);
      if (!mapNetwork.status) {
        return res.status(200).json({
          status: false,
          msg: "Mã nhà mạng không hợp lệ!"
        });
      }

      const checkPinExist = await CardHistoryModel.findOne({ where: { pin } });
      const checkSeriExist = await CardHistoryModel.findOne({ where: { seri } });
      if (checkPinExist || checkSeriExist) {
        return res.status(200).json({
          status: false,
          msg: "Mã thẻ hoặc seri này đã tồn tại trên hệ thống!"
        });
      }

      const transId = Helper.getRandomInt(10000000, 99999999);
      const createRequest = await paymentAutoService.createRequestCard(transId, mapNetwork.code, amount, pin, seri);

      if (createRequest.status) {
        const createDepositRequest = await CardHistoryModel.create({
          uid: req.user.id,
          transId,
          type: CardHistoryModel.TYPE_ENUM.RECHARGE,
          amount: Number(amount),
          network,
          pin,
          seri,
          info: `Nạp thẻ cào ${network.toUpperCase()} / ${Helper.numberWithCommas(amount)}`,
          status: CardHistoryModel.STATUS_ENUM.PENDING
        });
        if (!!createDepositRequest) {
          return res.json(createRequest);
        } else {
          return res.status(200).json({
            status: false,
            msg: "Error Create Request Deposit!"
          });
        }
      } else {
        return res.status(200).json({
          status: false,
          msg: createRequest.msg
        });
      }
    },
    createRequestAutoUsdt: async (req, res) => {
      try {
        const { subType, amount, sender } = req.body;
        if (!subType || !amount || !sender) {
          return res.json({
            status: false,
            msg: ERROR_FORM.MISSING_FIELD
          });
        }

        if (Number(amount) < 50) {
          return res.status(200).json({
            status: false,
            msg: "Minimum deposit amount must be greater than or equal to 50$"
          });
        }

        if (sender.length < 20) {
          return res.status(200).json({
            status: false,
            msg: "Invalid sender wallet address!"
          });
        }

        const transId = Helper.getRandomInt(10000000, 99999999);
        const createRequest = await paymentAutoService.createRequestUsdt(transId, amount, subType, sender, false);

        if (createRequest.status) {
          const createDepositRequest = await BankHistoryModel.create({
            uid: req.user.id,
            bankProvide: `USDT`,
            bankNumber: createRequest.data.phoneNum,
            bankName: "",
            transId: transId,
            type: BankHistoryModel.TYPE_ENUM.RECHARGE,
            amount: Number(amount),
            info: `Transfer USDT to wallet ${createRequest.data.bank_provider.toUpperCase()} / ${createRequest.data.phoneNum}`,
            status: BankHistoryModel.STATUS_ENUM.PENDING
          });
          if (!!createDepositRequest) {
            return res.json(createRequest);
          } else {
            return res.status(200).json({
              status: false,
              msg: "Error Create Request Deposit!"
            });
          }
        } else {
          return res.status(200).json({
            status: false,
            msg: createRequest.msg
          });
        }
      } catch (e) {
        console.log(e);
        res.status(200).json({
          status: false,
          msg: e.message,
          code: 500
        });
      }
    },
    fastpayCallback: async (req, res) => {
      try {
        const payload = req.body || {};
        const { ResponseCode, Description, ResponseContent, Signature } = payload;

        if (Signature === undefined || ResponseContent === undefined) {
          return res.status(400).send(FASTPAY_ERROR_RESPONSE);
        }

        const serializedContent = typeof ResponseContent === "string" ? ResponseContent : JSON.stringify(ResponseContent);
        const expectedSignature = md5(`${ResponseCode ?? ""}${Description ?? ""}${serializedContent}${fastpayConfig.partnerKey}`);

        if (expectedSignature !== Signature) {
          return res.status(401).send(FASTPAY_ERROR_RESPONSE);
        }

        const content = parseFastPayResponseContent(ResponseContent);

        if (!content || !content.RefCode) {
          return res.status(400).send(FASTPAY_ERROR_RESPONSE);
        }

        const record = await BankHistoryModel.findOne({
          where: {
            transId: String(content.RefCode),
            type: BankHistoryModel.TYPE_ENUM.RECHARGE,
            status: {
              [Op.in]: [
                BankHistoryModel.STATUS_ENUM.PROCESSING,
                BankHistoryModel.STATUS_ENUM.PENDING
              ]
            }
          }
        });

        if (!record) {
          return res.status(404).send(FASTPAY_ERROR_RESPONSE);
        }

        if (Number(ResponseCode) !== FASTPAY_SUCCESS_CODE) {
          record.status = BankHistoryModel.STATUS_ENUM.ERROR;
          await record.save();
          return res.send(FASTPAY_SUCCESS_RESPONSE);
        }

        const amount = Number(content.Amount || record.amount || 0);

        record.status = BankHistoryModel.STATUS_ENUM.SUCCESS;
        record.amount = amount;
        await record.save();
        await record.reload();

        const user = await findByID(record.uid);
        user.coin += amount;
        await user.save();
        await user.reload();

        const userJson = user.toJSON();
        delete userJson.password;
        delete userJson.verify;
        delete userJson.status;
        delete userJson.updatedAt;
        delete userJson.role;
        delete userJson.isPlay;
        delete userJson.deletedAt;
        delete userJson.createdAt;
        delete userJson.code;

        if (global.webSocket && typeof global.webSocket.sendToUser === "function") {
          global.webSocket.sendToUser(user.id, {
            notify: {
              type: "recharge",
              title: `Nạp ngân hàng thành công!`,
              message: `<p style=" text-align: center; font-size: 26px; ">Bạn vừa nạp thành công ${Helper.numberWithCommas(amount)} VND!</p>`
            },
            user: userJson
          });
        }

        const botTeleConfig = JSON.parse(fs.readFileSync(process.env.PWD + "/src/configs/telegram/bot.json", "utf8"));
        if (botTeleConfig.status) {
          const chatTeleConfig = JSON.parse(fs.readFileSync(process.env.PWD + "/src/configs/telegram/chatGroup.json", "utf8"));
          const messageTeleConfig = JSON.parse(fs.readFileSync(process.env.PWD + "/src/configs/telegram/message.json", "utf8"));
          const time = moment().format("DD/MM/YYYY HH:MM:ss");

          await teleBotSendMsg(chatTeleConfig.paymentBank, messageTeleConfig.paymentBank, {
            '{{time}}': time,
            '{{username}}': user.username,
            '{{name}}': user.name,
            '{{phone}}': user.phone,
            '{{email}}': user.email,
            '{{amount}}': Helper.numberWithCommas(amount),
            '{{transId}}': String(content.RefCode),
            '{{chargeTypeProvide}}': "BANK",
            '{{chargeTypeProvideVi}}': "Ngân hàng",
            '{{chargeTypeCode}}': record.bankProvide
          });
        }

        return res.send(FASTPAY_SUCCESS_RESPONSE);
      } catch (e) {
        console.log(e);
        return res.status(500).send(FASTPAY_ERROR_RESPONSE);
      }
    },
    createRequestUsePromotionCode: async (req, res) => {
      res.json({
        status: true,
        msg: `Mã khuyến mãi bảo trì!`
      });
    },
  }
};
