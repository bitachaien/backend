const moment = require("moment-timezone");
moment.tz.setDefault("Asia/Ho_Chi_Minh");
const { Op } = require("sequelize");
const {
  ERROR_PAGE,
  ERROR_FORM,
  ERROR_AUTH,
  ERROR_AUTH_MESSAGE,
  ERROR_MESSAGES
} = require("@Helpers/contants");
const Helper = require("@Helpers/helpers");
const { parseInt } = require("@Helpers/Number");

const TcgService = require("@Plugins/TcgService");

const { findByID, findByUsername, UserModel } = require("@Models/User/User");
const { BetHistoryModel } = require("@Models/Bet/BetHistory");
const { BetRefurnModel } = require("@Models/Bet/BetRefurn");
const BalanceFluct = require("@Models/User/BalanceFluct");

const { ApiConfigModel } = require("@Models/GameApi/ApiConfig");
const { ApiProductConfigModel } = require("@Models/GameApi/ApiProductConfig");

module.exports = {
  betHistory: async (req, res) => {
    try {
      const page = parseInt(req.query.page, true)
        ? parseInt(req.query.page, true)
        : 0;
      const kmess = parseInt(req.query.limit, true)
        ? parseInt(req.query.limit, true)
        : 0;

      if (!!page && !!kmess) {
        let match = {};

        let { from, to } = req.query;
        let timeStart, timeEnd;
        if (!!from && !!to) {
          timeStart = moment(from, "DD/MM/YYYY").startOf('day');
          timeEnd = moment(to, "DD/MM/YYYY").endOf('day');
        } else {
          timeStart = moment().startOf('day');
          timeEnd = moment().endOf('day');
        }
        match.createdAt = {
          [Op.between]: [timeStart.format(), timeEnd.format()]
        };

        // filter
        if (!!req.query.username) {
          match.username = req.query.username;
        }
        if (!!req.query.transid) {
          match.betOrderNo = req.query.transid;
        }
        if (!!req.query.game) {
          match.gameCode = req.query.game;
        }
        if (!!req.query.round) {
          match.sessionId = req.query.round;
        }

        let Task = [];

        Task.push(await BetHistoryModel.count({ where: match }));

        Task.push(await BetHistoryModel.findAll({
          where: match,
          offset: 0 + (page - 1) * kmess,
          limit: kmess,
          order: [["betTime", "DESC"]],
          attributes: { exclude: ["deletedAt"] },
          include: [
            {
              model: UserModel,
              as: "userInfo",
              attributes: { exclude: ["password", "id", "role", "deletedAt"] }
            }
          ]
        }));

        Task.push(await BetHistoryModel.findAll({
          where: {
            createdAt: {
              [Op.between]: [timeStart.format(), timeEnd.format()]
            }
          },
          order: [["betTime", "DESC"]],
          attributes: ["betAmount", "validBetAmount", "netPnl"],
        }));

        const [total, getData, getDataCount] = await Promise.all(Task);

        let totalBet = toalValidBet = totalPnl = 0;
        getDataCount.map((bet) => {
          totalBet += bet.betAmount;
          toalValidBet += bet.validBetAmount;
          totalPnl += bet.netPnl;
        });

        return res.status(200).json({
          status: true,
          data: {
            dataExport: getData,
            dataCount: {
              totalBet,
              toalValidBet,
              totalPnl
            },
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
        msg: e.message,
        code: 500
      });
    }
  },
  betHistoryByUser: async (req, res) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(200).json({
          status: false,
          msg: "Missing Param ID"
        });
      }

      if (!Number(id) >> 0) {
        return res.status(200).json({
          status: false,
          msg: "Err ID"
        });
      }

      const page = parseInt(req.query.page, true)
        ? parseInt(req.query.page, true)
        : 0;
      const kmess = parseInt(req.query.limit, true)
        ? parseInt(req.query.limit, true)
        : 0;

      if (!!page && !!kmess) {
        let match = {};
        // filter
        match.uid = id;

        let { from, to } = req.query;
        let timeStart, timeEnd;
        if (!!from && !!to) {
          timeStart = moment(from, "DD/MM/YYYY").startOf('day');
          timeEnd = moment(to, "DD/MM/YYYY").endOf('day');
        } else {
          timeStart = moment().startOf('day');
          timeEnd = moment().endOf('day');
        }
        match.createdAt = {
          [Op.between]: [timeStart.format(), timeEnd.format()]
        };

        if (!!req.query.transid) {
          match.betOrderNo = req.query.transid;
        }
        if (!!req.query.game) {
          match.gameCode = req.query.game;
        }
        if (!!req.query.round) {
          match.sessionId = req.query.round;
        }

        let Task = [];

        Task.push(await BetHistoryModel.count({ where: match }));

        Task.push(await BetHistoryModel.findAll({
          where: match,
          offset: 0 + (page - 1) * kmess,
          limit: kmess,
          order: [["betTime", "DESC"]],
          attributes: { exclude: ["deletedAt"] },
          include: [
            {
              model: UserModel,
              as: "userInfo",
              attributes: { exclude: ["password", "id", "role", "deletedAt"] }
            }
          ]
        }));

        Task.push(await BetHistoryModel.findAll({
          where: {
            uid: id,
            createdAt: {
              [Op.between]: [timeStart.format(), timeEnd.format()]
            }
          },
          order: [["betTime", "DESC"]],
          attributes: ["betAmount", "validBetAmount", "netPnl"],
        }));

        const [total, getData, getDataCount] = await Promise.all(Task);

        let totalBet = toalValidBet = totalPnl = 0;
        getDataCount.map((bet) => {
          totalBet += bet.betAmount;
          toalValidBet += bet.validBetAmount;
          totalPnl += bet.netPnl;
        });

        return res.status(200).json({
          status: true,
          data: {
            dataExport: getData,
            dataCount: {
              totalBet,
              toalValidBet,
              totalPnl
            },
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
        msg: e.message,
        code: 500
      });
    }
  },
  gameAvalible: async (req, res) => {
    try {
      const listProduct = await ApiProductConfigModel.findAll({
        attributes: { exclude: ["id", "createdAt", "deletedAt", "updatedAt"] }
      });
      let productAvailible = {};
      listProduct.forEach(product => {
        productAvailible[product.product_code] = {};
        productAvailible[product.product_code] = { ...product.dataValues };
        productAvailible[product.product_code].type = product.product_type;
        productAvailible[product.product_code].name = product.product_name;
        productAvailible[product.product_code].mode = product.product_mode;
      });
      res.status(200).json({
        status: true,
        data: productAvailible,
        msg: "success",
        code: 200
      });
    } catch (e) {
      console.log(e);
      res.status(200).json({
        status: false,
        msg: e.message,
        code: 500
      });
    }
  },
  betReturnHistory: async (req, res) => {
    try {
      const page = parseInt(req.query.page, true)
        ? parseInt(req.query.page, true)
        : 0;
      const kmess = parseInt(req.query.limit, true)
        ? parseInt(req.query.limit, true)
        : 0;

      if (!!page && !!kmess) {
        let match = {};

        let { from, to } = req.query;
        let timeStart, timeEnd;
        if (!!from && !!to) {
          timeStart = moment(from, "DD/MM/YYYY").startOf('day');
          timeEnd = moment(to, "DD/MM/YYYY").endOf('day');
        } else {
          timeStart = moment().startOf('day');
          timeEnd = moment().endOf('day');
        }
        match.createdAt = {
          [Op.between]: [timeStart.format(), timeEnd.format()]
        };

        // filter
        if (!!req.query.username) {
          match.username = req.query.username;
        }
        if (!!req.query.transid) {
          match.betOrderNo = req.query.transid;
        }
        if (!!req.query.game) {
          match.gameCode = req.query.game;
        }
        if (!!req.query.gameCategory) {
          match.gameCategory = req.query.gameCategory;
        }

        let Task = [];

        Task.push(await BetRefurnModel.count({ where: match }));
        Task.push(await BetRefurnModel.findAll({
          where: match,
          offset: 0 + (page - 1) * kmess,
          limit: kmess,
          order: [["createdAt", "DESC"]],
          attributes: { exclude: ["deletedAt"] },
          include: [
            {
              model: UserModel,
              as: "userInfo",
              attributes: { exclude: ["password", "id", "role", "deletedAt"] }
            }
          ]
        }));

        let match2 = {};
        if (!!req.query.username) {
          const userFilter = await findByUsername(req.query.username);
          match2.uid = userFilter.id;
        }
        match2.createdAt = {
          [Op.between]: [timeStart.format(), timeEnd.format()]
        }

        Task.push(await BetRefurnModel.findAll({
          where: match2,
          order: [["id", "DESC"]]
        }));

        const [total, getData, getDataCount] = await Promise.all(Task);

        let totalBet = totalValidBet = totalWinAmount = totalAmountRefurn = totalNetPnl = 0;
        getDataCount.map((row) => {
          totalBet += row.betAmount;
          totalValidBet += row.validBetAmount;
          totalWinAmount += row.winAmount;
          totalNetPnl += row.netPnl;
          totalAmountRefurn += row.amountReturn;
        });

        res.status(200).json({
          status: true,
          data: {
            dataExport: getData,
            dataCount: {
              totalBet,
              totalValidBet,
              totalWinAmount,
              totalAmountRefurn,
              totalNetPnl
            },
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
        msg: e.message,
        code: 500
      });
    }
  },
  wallets: async (req, res) => {
    try {
      const { id, username } = req.params;
      if (!id || !username) return res
        .status(200)
        .json({ status: false, msg: "Error Missing Param!" });

      if (id == "SITEWALLET") return res.status(200).json({
        status: true,
        balance: req.user.coin,
        msg: "success",
        code: 200
      });

      const listProductCode = await ApiProductConfigModel.getAllProductCode();

      if (!listProductCode.includes(id)) return res
        .status(200)
        .json({ status: false, msg: "Error Param ID Not Accept!" });

      const getProductConfig = await ApiProductConfigModel.getProductByCode(id);
      if (!getProductConfig) return res.status(200).json({
        status: false,
        msg: `Không tìm thấy Product Code này!`,
        code: 404
      });

      const getApiConfig = await ApiConfigModel.getApiConfigByName(getProductConfig.product_api);
      if (!getApiConfig) return res.status(200).json({
        status: false,
        msg: `Không tìm thấy Cấu hình Api cho Product Code này!`,
        code: 404
      });

      const tcgService = new TcgService(getApiConfig.api_config);

      const getBalance = await tcgService.getBalance(
        username,
        getProductConfig.product_type
      );

      if (getBalance) {
        if (getBalance.status == 0) {
          res.status(200).json({
            status: true,
            balance: getBalance.balance,
            msg: "success",
            code: 200
          });
        } else {
          res.status(200).json({
            status: false,
            msg: getBalance.error_desc,
            code: 500
          });
          return;
        }
      } else {
        res.status(200).json({
          status: false,
          msg: `Đã có lỗi bất ngờ xảy ra! Vui lòng thao tác lại...`,
          code: 500
        });
        return;
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
  returnPointAllToProvider: async (req, res) => {
    try {
      const { username } = req.params;
      if (!username) return res
        .status(200)
        .json({ status: false, msg: "Error Missing Param!" });

      const listProductCode = await ApiProductConfigModel.getAllProductCode();

      let listPromise = [];
      for (const productCode of listProductCode) {
        const getProductConfig = await ApiProductConfigModel.getProductByCode(productCode);
        if (!getProductConfig) continue;
        const getApiConfig = await ApiConfigModel.getApiConfigByName(getProductConfig.product_api);
        if (!getApiConfig) continue;

        const tcgService = new TcgService(getApiConfig.api_config);
        listPromise.push(await tcgService.userFullTransfer(
          username,
          getProductConfig.product_type,
          Helper.randomInteger(100000000000, 999999999999) // transID
        ));
      }

      let totalPoint = 0;
      const listPromiseGetBalance = await Promise.allSettled(listPromise);
      for (const provideBalance of listPromiseGetBalance) {
        if (provideBalance.status == "fulfilled") {
          const getBalance = provideBalance.value;
          if (getBalance) {
            if (getBalance.status == 0) {
              totalPoint += getBalance.amount;
            }
          }
        }
      }
      const amountUpdate = Math.floor(Number(totalPoint) * 1000);
      const user = await findByUsername(username);
      if (!!user) {
        user.coin += amountUpdate;
        await user.save();
        await user.reload();

        // create balance fluctuation
        await BalanceFluct.createBalaceFluct(
          user.id,
          BalanceFluct.BalanceFluctModel.ACTION_ENUM.TRANSFER_WALLET,
          BalanceFluct.BalanceFluctModel.TYPE_ENUM.PLUS,
          Number(amountUpdate),
          user.coin,
          `Quản trị viên thu hồi ${Helper.numberWithCommas(totalPoint)} điểm về tài khoản chính - cộng ${Helper.numberWithCommas(amountUpdate)}`
        );

        return res.status(200).json({
          status: true,
          balanceReturn: amountUpdate,
          msg: "success",
          code: 200
        });
      } else {
        return res.status(200).json({
          status: false,
          balanceReturn: 0,
          msg: "Không tìm thấy người dùng!",
          code: 200
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
  Action: {}
};
