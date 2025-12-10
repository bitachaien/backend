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
const { parseInt } = require("@Helpers/Number");
const { getTheAgencyLevel, getCurrentUserList } = require("@Models/Agency/AgencyHelper");
const { findByID, findByUsername, UserModel } = require("@Models/User/User");
const { BetHistoryModel } = require("@Models/Bet/BetHistory");
const { AgencyModel } = require("@Models/Agency/Agency");

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

        match.uid = await getCurrentUserList(req.agency.id, false);
        let listUID = match.uid;

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
            uid: listUID,
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

        res.status(200).json({
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

        if (!!req.query.transid) {
          match.betOrderNo = req.query.transid;
        }
        if (!!req.query.game) {
          match.gameCode = req.query.game;
        }
        if (!!req.query.round) {
          match.sessionId = req.query.round;
        }

        const total = await BetHistoryModel.count({ where: match });
        const getData = await BetHistoryModel.findAll({
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
        msg: e.message,
        code: 500
      });
    }
  },
  Action: {}
};
