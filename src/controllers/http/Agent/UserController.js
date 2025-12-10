const moment = require("moment-timezone");
moment.tz.setDefault("Asia/Ho_Chi_Minh");
const { Op } = require("sequelize");
const Sequelize = require("sequelize");
const {
  ERROR_PAGE,
  ERROR_FORM,
  ERROR_AUTH,
  ERROR_AUTH_MESSAGE,
  ERROR_MESSAGES
} = require("@Helpers/contants");
const Helper = require("@Helpers/helpers");
const { parseInt } = require("@Helpers/Number");
const {
  findByUsername,
  findByEmail,
  findByID,
  UserModel
} = require("@Models/User/User");
const { UserDeviceModel } = require("@Models/User/UserDevice");
const { BankUserModel } = require("@Models/Bank/BankUser");
const { BankHistoryModel } = require("@Models/Bank/BankHistory");
const { BetHistoryModel } = require("@Models/Bet/BetHistory");
const { WithdrawConditionModel } = require("@Models/Withdraw/WithdrawCondition");
const { BetRefurnModel } = require("@Models/Bet/BetRefurn");
const { AgencyRefModel } = require("@Models/Agency/AgencyRef");
const { UserIncentiveModel } = require("@Models/User/UserIncentive");
const { UserIncentiveDonateModel } = require("@Models/User/UserIncentiveDonate");

module.exports = {
  listUser: async (req, res) => {
    try {
      const page = parseInt(req.query.page, true)
        ? parseInt(req.query.page, true)
        : 0;
      const kmess = parseInt(req.query.limit, true)
        ? parseInt(req.query.limit, true)
        : 0;

      if (!!page && !!kmess) {
        let match = {};
        let assocScopes = [];

        // add condition agency = curent agency id
        match.agency = req.agency.id;
        // filter
        if (!!req.query.name) {
          assocScopes.push({ method: ['bySearchName', req.query.name] });
        }
        if (!!req.query.username) {
          assocScopes.push({ method: ['bySearchUsername', req.query.username] });
        }
        if (!!req.query.phone) {
          assocScopes.push({ method: ['bySearchPhone', req.query.phone] });
        }
        if (!!req.query.email) {
          assocScopes.push({ method: ['bySearchEmail', req.query.email] });
        }

        assocScopes.push({ method: ['withUserInfo'] }, { method: ['withRoleUser'] });

        let Task = [];


        Task.push(await AgencyRefModel.count({ where: match, distinct: false }));

        Task.push(await AgencyRefModel.scope(assocScopes).findAll({
          where: match,
          offset: 0 + (page - 1) * kmess,
          limit: kmess,
          order: [["id", "DESC"]],
          attributes: { exclude: ["uid", "agency", "deletedAt"] },
          distinct: false
        }));

        let [total, getUsers] = await Promise.all(Task);

        function getBankUser() {
          return new Promise(async (resolve, reject) => {
            for (const user of getUsers) {
              user.setDataValue('userBank',
                await BankUserModel.findOne({ 
                  where: { uid: user.userInfo.id }, 
                  attributes: { exclude: ["deletedAt", "updatedAt", "uid", "id"] },
                  order: [["id", "DESC"]],
                })
              );
            }
            resolve(getUsers);
          });
        }

        function getFinanUser() {
          return new Promise(async (resolve, reject) => {
            for (const user of getUsers) {
              const getFinan = await BankHistoryModel.findAll({
                where: {
                  uid: user.userInfo.id,
                  type: {
                    [Op.or]: [BankHistoryModel.TYPE_ENUM.RECHARGE, BankHistoryModel.TYPE_ENUM.CASHOUT]
                  },
                  status: BankHistoryModel.STATUS_ENUM.SUCCESS
                }
              });
              let totalDeposit = totalWithdraw = 0, countDeposit = 0, countWithdraw = 0;
              getFinan.forEach((finan) => {
                if (finan.type == BankHistoryModel.TYPE_ENUM.RECHARGE) {
                  countDeposit++;
                  totalDeposit += finan.amount;
                };
                if (finan.type == BankHistoryModel.TYPE_ENUM.CASHOUT) {
                  countWithdraw++;
                  totalWithdraw += finan.amount
                };
              });

              user.setDataValue('userFinan', {
                totalDeposit,
                countDeposit,
                totalWithdraw,
                countWithdraw
              });
            }
            resolve(getUsers);
          });
        }

        function getBetUser() {
          return new Promise(async (resolve, reject) => {
            for (const user of getUsers) {
              const getBet = await BetHistoryModel.findAll({
                where: {
                  uid: user.userInfo.id
                }
              });
              let betAmount = validBetAmount = winAmount = netPnl = 0;
              getBet.forEach((bet) => {
                // console.log(bet);
                betAmount += bet.betAmount * 1000;
                validBetAmount += bet.validBetAmount * 1000;
                winAmount += bet.winAmount * 1000;
                netPnl += bet.netPnl * 1000;
              });

              user.setDataValue('userBet', {
                betAmount,
                validBetAmount,
                winAmount,
                netPnl
              });
            }
            resolve(getUsers);
          });
        }

        function getWitdrawCondiUser() {
          return new Promise(async (resolve, reject) => {
            for (const user of getUsers) user.setDataValue('userWithdrawCondi', await WithdrawConditionModel.findOne({
              where: {
                uid: user.userInfo.id
              }
            }));
            resolve(getUsers);
          });
        }

        function getRefurnUser() {
          return new Promise(async (resolve, reject) => {
            for (const user of getUsers) {
              const getBet = await BetRefurnModel.findAll({
                where: {
                  uid: user.userInfo.id
                }
              });
              let amountReturn = 0;
              getBet.forEach((bet) => {
                // console.log(bet);
                amountReturn += bet.amountReturn;
              });

              user.setDataValue('userRefurn', amountReturn);
            }
            resolve(getUsers);
          });
        }

        function getIncentiveUser() {
          return new Promise(async (resolve, reject) => {
            for (const user of getUsers) {
              const getBet = await UserIncentiveModel.findAll({
                where: {
                  uid: user.userInfo.id
                }
              });
              let incentive = 0;
              getBet.forEach((bet) => {
                // console.log(bet);
                incentive += bet.amount;
              });

              user.setDataValue('userIncentive', incentive);
            }
            resolve(getUsers);
          });
        }

        function getIncentiveDonateUser() {
          return new Promise(async (resolve, reject) => {
            for (const user of getUsers) {
              const getBet = await UserIncentiveDonateModel.findAll({
                where: {
                  uid: user.userInfo.id
                }
              });
              let incentive = 0;
              getBet.forEach((bet) => {
                // console.log(bet);
                incentive += bet.amount;
              });

              user.setDataValue('userIncentiveDonate', incentive);
            }
            resolve(getUsers);
          });
        }

        function getUserDevice() {
          return new Promise(async (resolve, reject) => {
            for (const user of getUsers) {
              const getBet = await UserDeviceModel.findOne({
                where: {
                  uid: user.userInfo.id
                }
              });
              user.setDataValue('device', getBet);
            }
            resolve(getUsers);
          });
        }

        await Promise.all([
          getBankUser(),
          getFinanUser(),
          getWitdrawCondiUser(),
          getBetUser(),
          getRefurnUser(),
          getIncentiveUser(),
          getIncentiveDonateUser(),
          getUserDevice()
        ]).then(() => {
          // console.log(getUsers);
          return res.status(200).json({
            status: true,
            data: {
              dataExport: getUsers,
              page: page,
              kmess: kmess,
              total: total
            },
            msg: "SUCCESS"
          });
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
  deleteUser: async (req, res) => {
    try {
      return res.status(200).json({
        status: false,
        msg: "Hành động không được phép!"
      });

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

      const user = await UserModel.findOne({ where: { id } });

      if (!!user) {
        // reset tất cả tiền tcg
        // const balanceTcgRecovery = await resetBalanceToZero(user.username);
        const balanceTcgRecovery = null;



        const deleteUser = await UserModel.destroy({
          where: { id: user.id },
          force: true
        });

        if (!!deleteUser) {
          return res.status(200).json({
            status: true,
            data: null,
            msg: "Success"
          });
        } else {
          return res.status(200).json({
            status: false,
            msg: "Err Delete User"
          });
        }
      } else {
        return res.status(200).json({
          status: false,
          msg: "User not found"
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
  userInfo: async (req, res) => {
    try {
      const { id } = req.params;

      if (!id) return res.status(200).json({
        status: false,
        msg: "Missing Param ID"
      });

      if (!Number(id) >> 0) return res.status(200).json({
        status: false,
        msg: "Err ID"
      });

      const user = await UserModel.findOne({
        where: { id, role: UserModel.ROLE_ENUM.USER },
        attributes: { exclude: ["password", "role", "deletedAt"] },
        include: [
          {
            model: UserDeviceModel,
            as: "user_device",
            attributes: { exclude: ["deletedAt"] },
            require: true
          },
          {
            model: BankUserModel,
            as: "BankUser",
            attributes: { exclude: ["deletedAt"] },
            require: true
          },
          {
            model: WithdrawConditionModel,
            as: "WithdrawConditionInfo",
            require: true
          }
        ]
      });

      if (!!user) {
        return res.status(200).json({
          status: true,
          data: user,
          msg: "success"
        });
      } else {
        return res.status(200).json({
          status: false,
          msg: "User not found"
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
  userProfit: async (req, res) => {
    try {
      const { id } = req.params;

      if (!id) return res.status(200).json({
        status: false,
        msg: "Missing Param ID"
      });

      if (!Number(id) >> 0) return res.status(200).json({
        status: false,
        msg: "Err ID"
      });

      const user = await UserModel.findOne({
        where: { id, role: UserModel.ROLE_ENUM.USER },
      });

      if (!user) return res.status(200).json({
        status: false,
        msg: "User not found!"
      });

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

      let Task = [];

      Task.push(await BankHistoryModel.findAll({
        where: {
          uid: user.id,
          createdAt: {
            [Op.between]: [timeStart.format(), timeEnd.format()]
          }
        },
        order: [["id", "DESC"]]
      }));

      Task.push(await BetHistoryModel.findAll({
        where: {
          uid: user.id,
          createdAt: {
            [Op.between]: [timeStart.format(), timeEnd.format()]
          }
        },
        order: [["id", "DESC"]]
      }));

      Task.push(await BetRefurnModel.findAll({
        where: {
          uid: user.id,
          createdAt: {
            [Op.between]: [timeStart.format(), timeEnd.format()]
          }
        },
        order: [["id", "DESC"]]
      }));

      const [getFinan, getBet, getRefurn] = await Promise.all(Task);

      return res.status(200).json({
        status: true,
        data: {
          finan: getFinan,
          bet: getBet,
          refurn: getRefurn
        },
        msg: "success"
      });

    } catch (e) {
      console.log(e);
      return res.status(200).json({
        status: false,
        msg: e.message,
        code: 500
      });
    }
  },
  listUsername: async (req, res) => {
    try {
      let match = {};
      match.role = UserModel.ROLE_ENUM.USER;
      if (!!req.query.username) {
        match.username = { [Op.like]: `%${req.query.username}%` };
      }

      const getUsers = await UserModel.findAll({
        where: match,
        order: Sequelize.literal("rand()"),
        attributes: ["username"]
      });

      const dataExport = [];
      getUsers.forEach((user) => dataExport.push(user.username));

      res.status(200).json({
        status: true,
        data: dataExport,
        msg: "SUCCESS"
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
  Action: {
    update: async (req, res) => {
      try {
        return res.status(200).json({
          status: false,
          msg: "Hành động không được phép!"
        });

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

        const { name, username, email, phone, coin, status, verify, role } = req.body;

        const user = await findByID(id);
        if (!!user) {
          user.isPlay = UserModel.IS_PLAY_ENUM.FALSE;
          user.name = name;
          user.username = username;
          user.email = email;
          user.phone = phone;
          user.coin = coin;
          user.status = status;
          user.verify = verify;
          if (role == UserModel.ROLE_ENUM.USER || role == UserModel.ROLE_ENUM.AGENCY) user.role = role;

          user.save();
          user.reload();
          res.status(200).json({
            status: true,
            msg: "Cập nhật thành công!",
            code: 200
          });
        } else {
          res.status(200).json({
            status: false,
            msg: "User not found!",
            code: 400
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
    }
  }
};
