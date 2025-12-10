const moment = require("moment-timezone");
moment.tz.setDefault("Asia/Ho_Chi_Minh");
const fs = require('fs');
const { Op } = require("sequelize");
const Sequelize = require("sequelize");
const redis = require("@Databases/redis");
const {
  ERROR_PAGE,
  ERROR_FORM,
  ERROR_AUTH,
  ERROR_AUTH_MESSAGE,
  ERROR_MESSAGES
} = require("@Helpers/contants");
const Helper = require("@Helpers/helpers");
const { parseInt } = require("@Helpers/Number");
const { generatePassword, validatePassword } = require("@Helpers/password");
const {
  findByUsername,
  findByEmail,
  findByID,
  UserModel
} = require("@Models/User/User");
const { UserDeviceModel } = require("@Models/User/UserDevice");
const { UserIncentiveModel } = require("@Models/User/UserIncentive");
const { UserIncentiveDonateModel } = require("@Models/User/UserIncentiveDonate");
const { BankUserModel } = require("@Models/Bank/BankUser");
const { BankHistoryModel } = require("@Models/Bank/BankHistory");
const { BetHistoryModel } = require("@Models/Bet/BetHistory");
const { AgencyModel } = require("@Models/Agency/Agency");
const { AgencyRefModel } = require("@Models/Agency/AgencyRef");
const { WithdrawConditionModel } = require("@Models/Withdraw/WithdrawCondition");
const BalanceFluct = require("@Models/User/BalanceFluct");
const teleBotSendMsg = require('@Plugins/TelegramBot');
const { BetRefurnModel } = require("@Models/Bet/BetRefurn");
const { AdminPasswdSecurityModel } = require("@Models/Admin/AdminPasswdSecurity");

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
        match.is_bot = false;
        match.role = UserModel.ROLE_ENUM.USER;

        // filter
        if (!!req.query.name) {
          match.name = { [Op.like]: `%${req.query.name}%` };
        }
        if (!!req.query.username) {
          match.username = { [Op.like]: `%${req.query.username}%` };
        }
        if (!!req.query.phone) {
          match.phone = { [Op.like]: `%${req.query.phone}%` };
        }
        if (!!req.query.email) {
          match.email = req.query.email;
        }

        const total = await UserModel.count({ where: match, distinct: false });
        const getUsers = await UserModel.findAll({
          where: match,
          offset: 0 + (page - 1) * kmess,
          limit: kmess,
          order: [["id", "DESC"]],
          attributes: { exclude: ["password", "deletedAt", "role"] },
          include: [
            {
              model: BankUserModel,
              as: "BankUser"
            },
            {
              model: WithdrawConditionModel,
              as: "WithdrawConditionInfo"
            }
          ],
          raw: true,
          nest: true
        });

        let dataExport = [];

        const Task = await Promise.all(getUsers.map(async (userData) => {
          let cacheUserData = userData;
          cacheUserData.totalDeposit = 0;
          cacheUserData.countDeposit = 0;
          cacheUserData.totalWithdraw = 0;
          cacheUserData.countWithdraw = 0;
          cacheUserData.totalRefurn = 0;

          const getBankHistory = await BankHistoryModel.findAll({
            where: {
              uid: userData.id,
              status: BankHistoryModel.STATUS_ENUM.SUCCESS
            },
            attributes: ["type", "amount"]
          });

          getBankHistory.forEach((item) => {
            if (item.type == BankHistoryModel.TYPE_ENUM.RECHARGE) {
              cacheUserData.countDeposit++;
              cacheUserData.totalDeposit += item.amount
            };
            if (item.type == BankHistoryModel.TYPE_ENUM.CASHOUT) {
              cacheUserData.countWithdraw++;
              cacheUserData.totalWithdraw += item.amount;
            };
          });

          const getBetRefurn = await BetRefurnModel.findAll({
            where: {
              uid: userData.id
            },
            attributes: ["amountReturn"]
          });

          getBetRefurn.forEach((item) => {
            cacheUserData.totalRefurn += item.amountReturn;
          });

          cacheUserData.Agency = {};
          const getRefAgency = await AgencyRefModel.findOne({
            where: {
              uid: userData.id
            }
          });
          if (getRefAgency) {
            const getRefAgencyInfo = await AgencyModel.findOne({
              where: {
                id: getRefAgency.agency
              }
            });
            if (getRefAgencyInfo) {
              cacheUserData.Agency.uid = getRefAgency.uid;
              cacheUserData.Agency.agency = getRefAgency.agency;
              cacheUserData.Agency.agency_code = getRefAgencyInfo.code;
            } else {
              cacheUserData.Agency.uid = getRefAgency.uid;
              cacheUserData.Agency.agency = getRefAgency.agency;
              cacheUserData.Agency.agency_code = "";
            }
          } else {
            cacheUserData.Agency.uid = "";
            cacheUserData.Agency.agency = "";
            cacheUserData.Agency.agency_code = "";
          }

          cacheUserData.netPnl = 0;
          cacheUserData.validBetAmount = 0;
          const getBetHistory = await BetHistoryModel.findAll({
            where: {
              uid: userData.id
            },
            attributes: ["netPnl", "validBetAmount"]
          });

          getBetHistory.forEach((item) => {
            cacheUserData.netPnl += item.netPnl * 1000;
            cacheUserData.validBetAmount += item.validBetAmount * 1000;
          });

          cacheUserData.incentive = 0;
          const getIncentive = await UserIncentiveModel.findAll({ where: { uid: userData.id } });
          getIncentive.forEach((item) => {
            cacheUserData.incentive += item.amount;
          });

          cacheUserData.incentiveDonate = 0;
          const getIncentiveDonate = await UserIncentiveDonateModel.findAll({ where: { uid: userData.id } });
          getIncentiveDonate.forEach((item) => {
            cacheUserData.incentiveDonate += item.amount;
          });

          cacheUserData.device = {};
          const getUserDevice = await UserDeviceModel.findByID(userData.id);
          cacheUserData.device = getUserDevice;

          dataExport.push(cacheUserData);
        }));

        return res.status(200).json({
          status: true,
          data: {
            dataExport: dataExport,
            page: page,
            kmess: kmess,
            total: total
          },
          msg: "SUCCESS"
        });
      } else {
        return res.status(200).json({
          status: false,
          msg: ERROR_FORM.MISSING_FIELD
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
  deleteUser: async (req, res) => {
    try {
      return res.status(200).json({
        status: false,
        msg: "Hành độn không được phép!"
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
        //const balanceTcgRecovery = await resetBalanceToZero(user.username);
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
            attributes: { exclude: ["deletedAt"] }
          },
          {
            model: BankUserModel,
            as: "BankUser",
            attributes: { exclude: ["deletedAt"] }
          },
          {
            model: WithdrawConditionModel,
            as: "WithdrawConditionInfo"
          }
        ],
        raw: true,
        nest: true
      });

      if (!!user) {
        let cacheUserData = user;
        cacheUserData.agency = null;
        const getRefAgency = await AgencyRefModel.findOne({
          where: {
            uid: user.id
          }
        });
        if (getRefAgency) {
          const getRefAgencyInfo = await AgencyModel.findOne({
            where: {
              id: getRefAgency.agency
            }
          });
          if (getRefAgencyInfo) {
            cacheUserData.agency = getRefAgencyInfo.code;
          }
        }

        return res.status(200).json({
          status: true,
          data: cacheUserData,
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

      Task.push(await UserIncentiveModel.findAll({
        where: {
          uid: user.id,
          createdAt: {
            [Op.between]: [timeStart.format(), timeEnd.format()]
          }
        },
        order: [["id", "DESC"]]
      }));

      const [getFinan, getBet, getRefurn, getIncentive] = await Promise.all(Task);


      return res.status(200).json({
        status: true,
        data: {
          finan: getFinan,
          bet: getBet,
          refurn: getRefurn,
          incentive: getIncentive
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
  getListUserBank: async (req, res) => {
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

      const user = await UserModel.findOne({ where: { id } });

      if (user) {
        const bankUser = await BankUserModel.findAll({
          where: { uid: user.id }
        });

        res.status(200).json({
          status: true,
          data: bankUser,
          msg: "SUCCESS"
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
  updateBankUser: async (req, res) => {
    try {
      const { id } = req.params;
      const { bankId, bankNumber, bankName } = req.body;

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
      if (user) {
        const bankUser = await BankUserModel.findOne({
          where: { uid: id, id: bankId }
        });

        if (bankUser) {
          bankUser.bankNumber = bankNumber;
          bankUser.bankName = bankName;
          await bankUser.save();
          await bankUser.reload();

          res.status(200).json({
            status: true,
            data: bankUser,
            msg: "SUCCESS"
          });
        } else {
          return res.status(200).json({
            status: false,
            msg: "Bank not found"
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
  deleteBankUser: async (req, res) => {
    try {
      const { id } = req.params;
      const { bankId } = req.body;

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

      if (user) {
        const bankUser = await BankUserModel.findOne({
          where: { uid: id, id: bankId }
        });

        if (bankUser) {
          const deleteBankUser = await BankUserModel.destroy({
            where: { uid: id, id: bankId },
            force: true
          });

          if (!!deleteBankUser) {
            return res.status(200).json({
              status: true,
              data: null,
              msg: "Success"
            });
          } else {
            return res.status(200).json({
              status: false,
              msg: "Err Delete Bank User"
            });
          }
        } else {
          return res.status(200).json({
            status: false,
            msg: "Bank not found"
          });
        }

        res.status(200).json({
          status: true,
          data: [],
          msg: "SUCCESS"
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
  BalanceFluction: async (req, res) => {
    try {
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

      const user = await UserModel.findOne({ where: { id } });
      if (!user) return res.status(200).json({
        status: false,
        msg: "User not found"
      });

      const page = parseInt(req.query.page, true)
        ? parseInt(req.query.page, true)
        : 0;
      const kmess = parseInt(req.query.limit, true)
        ? parseInt(req.query.limit, true)
        : 0;

      if (!!page && !!kmess) {
        let match = {};
        match.uid = user.id;

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

        if (!!req.query.note) {
          match.note = { [Op.like]: `%${req.query.note}%` };
        }
        if (!!req.query.type) {
          match.type = req.query.type;
        }
        if (!!req.query.action) {
          match.action = req.query.action;
        }
        if (!!req.query.amount) {
          match.amount = req.query.amount;
        }

        let Task = [];

        Task.push(await BalanceFluct.BalanceFluctModel.count({ where: match, distinct: false }));
        Task.push(await BalanceFluct.BalanceFluctModel.findAll({
          where: match,
          offset: 0 + (page - 1) * kmess,
          limit: kmess,
          order: [["id", "DESC"]],
          attributes: { exclude: ["deletedAt"] },
          include: [
            {
              model: UserModel,
              as: "user_info",
              attributes: { exclude: ["password", "id", "role", "deletedAt"] }
            }
          ],
          distinct: false
        }));

        const [total, getData] = await Promise.all(Task);

        return res.status(200).json({
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
        return res.status(200).json({
          status: false,
          msg: ERROR_FORM.MISSING_FIELD
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
  Action: {
    update: async (req, res) => {
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

        const { agency, name, username, email, phone, coin, status, verify, role, withdrawCondBet, withdrawCondCoin } = req.body;

        const user = await findByID(id);
        if (!!user) {
          if (agency) {
            // check agency exit
            const getAgencyInfo = await AgencyModel.findOne({
              where: {
                code: agency
              }
            });
            if (!getAgencyInfo) return res.status(200).json({
              status: false,
              msg: "Không tìm thấy đại lý này! code 1",
              code: 400
            });

            const checkRoleAgency = await UserModel.findOne({ where: { id: getAgencyInfo.uid } });
            if (checkRoleAgency.role != UserModel.ROLE_ENUM.AGENCY) return res.status(200).json({
              status: false,
              msg: "Không tìm thấy đại lý này! code 2",
              code: 400
            });

            if (getAgencyInfo.code == user.username || getAgencyInfo.uid == user.id) return res.status(200).json({
              status: false,
              msg: "Mã đại lý phải khác với tên người dùng hiện tại!",
              code: 400
            });

            // getAgencyInfo.id

            // check ref exiteds
            const getRefAgency = await AgencyRefModel.findOne({
              where: {
                uid: user.id
              }
            });
            if (getRefAgency) {
              if (getRefAgency.agency != getAgencyInfo.id) {
                getRefAgency.agency = getAgencyInfo.id;
                await getRefAgency.save();
                await getRefAgency.reload();
              }
            } else {
              await AgencyRefModel.create({
                uid: user.id,
                agency: getAgencyInfo.id
              });
            }
          } else {
            // check ref exiteds
            const getRefAgency = await AgencyRefModel.findOne({
              where: {
                uid: user.id
              }
            });
            if (getRefAgency) {
              await AgencyRefModel.destroy({
                where: { uid: getRefAgency.uid },
                force: true
              });
            }
          }

          const userWithdrawCondition = await WithdrawConditionModel.findByUserId(user.id);
          if (!userWithdrawCondition) return res.status(200).json({
            status: false,
            msg: "Không tìm thấy điều kiện vòng cược cho người dùng này!",
            code: 400
          });
          userWithdrawCondition.minimumNumbOfBet = withdrawCondBet;
          userWithdrawCondition.totalMinimumBetAmount = withdrawCondCoin;
          await userWithdrawCondition.save();
          await userWithdrawCondition.reload();

          user.name = name.toUpperCase();
          user.username = username.toLowerCase();
          user.email = email.toLowerCase();
          user.phone = phone.toLowerCase();
          // user.coin = coin;
          user.status = status;
          user.verify = verify;
          if (role == UserModel.ROLE_ENUM.USER || role == UserModel.ROLE_ENUM.AGENCY) user.role = role;
          await user.save();
          await user.reload();

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
    },
    updateBalance: async (req, res) => {
      try {
        const { id } = req.params;

        if (!id) return res.status(200).json({ status: false, msg: "Missing Param ID" });
        if (!Number(id) >> 0) return res.status(200).json({ status: false, msg: "Err ID" });

        const user = await findByID(id);
        if (!user) return res.status(200).json({ status: false, msg: "Không tìm thấy người dùng này!", code: 400 });

        const { type, password2, coin, coin_bonus, coin_donate, create_transaction } = req.body;

        if (!password2) return res.status(200).json({ status: false, msg: "Missing Param Password 2" });

        const getUserSecrPasswd = await AdminPasswdSecurityModel.findPasswdByUserId(req.user.id);
        if (!getUserSecrPasswd) return res.status(200).json({ status: false, msg: "Mật khẩu cấp 2 chưa được thiết lập!", code: "err_pass_not_init" });

        if (!validatePassword(password2, getUserSecrPasswd.password)) return res.status(200).json({
          status: false,
          msg: "Mật khẩu cấp 2 không đúng!",
          code: "err_old_password"
        });

        switch (type) {
          case 1: // cộng tiền
            if (coin <= 0) return res.status(200).json({
              status: false,
              msg: "Số tiền không hợp lệ!",
              code: "err_coin_trans"
            });
            user.coin += coin;

            if (create_transaction == 1) {
              let isFirstDeposit = false;

              const depositBank = await BankHistoryModel.findAll({
                where: {
                  uid: user.id,
                  type: BankHistoryModel.TYPE_ENUM.RECHARGE,
                  status: BankHistoryModel.STATUS_ENUM.SUCCESS,
                  is_first: BankHistoryModel.IS_FIRST.TRUE
                }
              });
              if (depositBank.length == 0) isFirstDeposit = true;

              const createDepositTrans = await BankHistoryModel.create({
                uid: user.id,
                bankProvide: "Admin " + req.user.username + " tạo lệnh",
                bankNumber: "Admin " + req.user.username + " tạo lệnh",
                bankName: "Admin " + req.user.username + " tạo lệnh",
                transId: Helper.getRandomInt(1111111111111, 9999999999999),
                type: BankHistoryModel.TYPE_ENUM.RECHARGE,
                amount: coin,
                info: `Admin ${req.user.username} tạo lệnh ${coin_bonus > 0 ? `- Tặng khuyến mãi ${Helper.numberWithCommas(coin_bonus)}` : ""}`,
                status: BankHistoryModel.STATUS_ENUM.SUCCESS,
                is_first: isFirstDeposit
              });
              if (coin_bonus > 0) {
                if (coin_bonus > 0) user.coin += coin_bonus;
                const createIncentive = await UserIncentiveModel.create({
                  uid: user.id,
                  type: UserIncentiveModel.TYPE_ENUM.DEPOSIT,
                  amount: coin_bonus,
                  description: `Admin ${req.user.username} cập nhật số dư và tạo đơn nạp tiền id: ${createDepositTrans.id}, nhận ${Helper.numberWithCommas(coin_bonus)} khuyến mãi nạp tiền.`
                });
              }
            }
            await user.save();
            await user.reload();

            const amountChanger = (create_transaction == 1) ? Math.abs(coin + coin_bonus) : Math.abs(coin);

            // create balance fluctuation
            await BalanceFluct.createBalaceFluct(
              user.id,
              BalanceFluct.BalanceFluctModel.ACTION_ENUM.BALANCE_UPDATE,
              BalanceFluct.BalanceFluctModel.TYPE_ENUM.PLUS,
              Number(amountChanger),
              user.coin,
              `Admin ${req.user.username}: Cập nhật số dư - Cộng ${Helper.numberWithCommas(amountChanger)} ${create_transaction == 1 ? "- Tạo đơn nạp" : ""} ${create_transaction == 1 && coin_bonus > 0 ? `- Tặng khuyến mãi ${Helper.numberWithCommas(coin_bonus)}` : ""} `
            );
            break;
          case 2: // tru tiền
            if (coin <= 0) return res.status(200).json({
              status: false,
              msg: "Số tiền không hợp lệ!",
              code: "err_coin_trans"
            });
            if (user.coin < coin) return res.status(200).json({
              status: false,
              msg: `Số tiền tối đa có thể trừ là ${Helper.numberWithCommas(user.coin)}`,
              code: "err_coin_trans"
            });
            user.coin -= coin;
            await user.save();
            await user.reload();

            // create balance fluctuation
            await BalanceFluct.createBalaceFluct(
              user.id,
              BalanceFluct.BalanceFluctModel.ACTION_ENUM.BALANCE_UPDATE,
              BalanceFluct.BalanceFluctModel.TYPE_ENUM.MINUS,
              Number(coin),
              user.coin,
              `Admin ${req.user.username}: Cập nhật số dư - Trừ ${Helper.numberWithCommas(coin)}`
            );
            break;
          case 3: // tang khuyen mai
            if (coin_donate <= 0) return res.status(200).json({
              status: false,
              msg: "Số tiền khuyến mãi không hợp lệ!",
              code: "err_coin_donate_trans"
            });
            user.coin += coin_donate;
            await user.save();
            await user.reload();

            const createIncentive = await UserIncentiveModel.create({
              uid: user.id,
              type: UserIncentiveModel.TYPE_ENUM.DEPOSIT,
              amount: coin_donate,
              description: `Admin ${req.user.username} tặng khuyến mãi ${Helper.numberWithCommas(coin_donate)}`
            });

            // create balance fluctuation 
            await BalanceFluct.createBalaceFluct(
              user.id,
              BalanceFluct.BalanceFluctModel.ACTION_ENUM.BALANCE_UPDATE,
              BalanceFluct.BalanceFluctModel.TYPE_ENUM.PLUS,
              Number(coin_donate),
              user.coin,
              `Admin ${req.user.username}: Cập nhật số dư - Tặng Khuyến mãi ${Helper.numberWithCommas(coin_donate)}`
            );

            break;
          default:
            return res.status(200).json({
              status: false,
              msg: "Loại biến động không hợp lệ!",
              code: "err_trans_type"
            });
        }

        return res.status(200).json({
          status: true,
          msg: "Cập nhật thành công!"
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
    createIncentive: async (req, res) => {
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

        const user = await UserModel.findByPk(id);
        if (!user) return res.status(200).json({
          status: false,
          msg: "Không tìm thấy người dùng này!",
          code: 400
        });

        const {
          type,
          password2,
          coin,
          coin_bonus,
          create_transaction
        } = req.body;

        if (coin <= 0) return res.status(200).json({
          status: false,
          msg: "Số tiền không hợp lệ!",
          code: "err_coin_trans"
        });

        if (!password2) {
          return res.status(200).json({
            status: false,
            msg: "Missing Param Password 2"
          });
        }

        const getUserSecrPasswd = await AdminPasswdSecurityModel.findPasswdByUserId(req.user.id);
        if (!getUserSecrPasswd) return res.status(200).json({
          status: false,
          msg: "Mật khẩu cấp 2 chưa được thiết lập!",
          code: "err_pass_not_init"
        });

        if (!validatePassword(password2, getUserSecrPasswd.password)) return res.status(200).json({
          status: false,
          msg: "Mật khẩu cấp 2 không đúng!",
          code: "err_old_password"
        });

        // số dư trước giao dịch
        let tmpBalance = user.coin;

        let typeFluct;
        if (type == 1) {
          user.coin += coin;
          typeFluct = BalanceFluct.BalanceFluctModel.TYPE_ENUM.PLUS;
        } else if (type == 2) {
          user.coin -= coin;
          typeFluct = BalanceFluct.BalanceFluctModel.TYPE_ENUM.MINUS;
        } else {
          return res.status(200).json({
            status: false,
            msg: "Loại biến động không hợp lệ!",
            code: "err_trans_type"
          });
        }
        if (coin_bonus > 0) user.coin += coin_bonus;
        await user.save();
        await user.reload();

        const amountChanger = Math.abs(coin + coin_bonus);

        if (type == 1) {
          // tạo đơn nạp tiền (ghi nhận vào doanh thu)
          if (create_transaction == 1) {
            let isFirstDeposit = false;

            const depositBank = await BankHistoryModel.findAll({
              where: {
                uid: user.id,
                type: BankHistoryModel.TYPE_ENUM.RECHARGE,
                status: BankHistoryModel.STATUS_ENUM.SUCCESS
              }
            });
            if (depositBank.length == 0) isFirstDeposit = true;

            const createDepositTrans = await BankHistoryModel.create({
              uid: user.id,
              bankProvide: req.user.username + " tạo lệnh",
              bankNumber: req.user.username + " tạo lệnh",
              bankName: req.user.username + " tạo lệnh",
              transId: Helper.getRandomInt(1111111111111, 9999999999999),
              type: BankHistoryModel.TYPE_ENUM.RECHARGE,
              amount: coin,
              info: `${req.user.username} tạo lệnh ${coin_bonus > 0 ? `- Tặng khuyến mãi ${Helper.numberWithCommas(coin_bonus)}` : ""}`,
              status: BankHistoryModel.STATUS_ENUM.SUCCESS,
              is_first: isFirstDeposit
            });
            if (coin_bonus > 0) {
              const createIncentive = await UserIncentiveModel.create({
                uid: user.id,
                type: UserIncentiveModel.TYPE_ENUM.DEPOSIT,
                amount: coin_bonus,
                description: `Cập nhật số dư và tạo đơn nạp tiền id: ${createDepositTrans.id}, nhận ${Helper.numberWithCommas(coin_bonus)} khuyến mãi nạp tiền.`
              });
            }
          }
        }


        // create balance fluctuation
        await BalanceFluct.createBalaceFluct(
          user.id,
          BalanceFluct.BalanceFluctModel.ACTION_ENUM.BALANCE_UPDATE,
          typeFluct,
          Number(amountChanger),
          user.coin,
          `Admin ${req.user.username}: Cập nhật số dư - ${(type == 1) ? "Cộng" : "Trừ"} ${Helper.numberWithCommas(amountChanger)} ${coin_bonus > 0 ? `- Tặng khuyến mãi ${Helper.numberWithCommas(coin_bonus)}` : ""} `
        );

        return res.status(200).json({
          status: true,
          msg: "Cập nhật thành công!"
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
    createIncentiveDonate: async (req, res) => {
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

        const user = await UserModel.findByPk(id);
        if (!user) return res.status(200).json({
          status: false,
          msg: "Không tìm thấy người dùng này!",
          code: 400
        });

        const {
          coin,
          note,
          password2
        } = req.body;

        if (coin <= 0) return res.status(200).json({
          status: false,
          msg: "Số tiền không hợp lệ!",
          code: "err_coin_trans"
        });

        if (!password2) return res.status(200).json({
          status: false,
          msg: "Missing Param Password 2"
        });

        const getUserSecrPasswd = await AdminPasswdSecurityModel.findPasswdByUserId(req.user.id);
        if (!getUserSecrPasswd) return res.status(200).json({
          status: false,
          msg: "Mật khẩu cấp 2 chưa được thiết lập!",
          code: "err_pass_not_init"
        });

        if (!validatePassword(password2, getUserSecrPasswd.password)) return res.status(200).json({
          status: false,
          msg: "Mật khẩu cấp 2 không đúng!",
          code: "err_old_password"
        });

        // số dư trước giao dịch
        let tmpBalance = user.coin;
        user.coin += coin;
        await user.save();
        await user.reload();

        // lưu vào cột donate
        await UserIncentiveDonateModel.create({
          admin_id: req.user.id,
          uid: id,
          amount: coin,
          note: note,
          description: `${req.user.username} tặng khuyễn mãi khách hàng ${Helper.numberWithCommas(coin)}`
        });

        // create balance fluctuation
        await BalanceFluct.createBalaceFluct(
          user.id,
          BalanceFluct.BalanceFluctModel.ACTION_ENUM.BALANCE_UPDATE,
          BalanceFluct.BalanceFluctModel.TYPE_ENUM.PLUS,
          Number(coin),
          user.coin,
          `${req.user.username}: tặng khuyễn mãi khách hàng ${Helper.numberWithCommas(coin)}`
        );

        return res.status(200).json({
          status: true,
          msg: "Cập nhật thành công!"
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
    changePassword: async (req, res) => {
      try {
        const { id } = req.params;
        const { newPassword } = req.body;

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

        if (newPassword.length <= 5) {
          return res.status(200).json({
            status: false,
            msg: "Mật khẩu ít nhất 5 ký tự!"
          });
        }

        const user = await findByID(id);

        if (!!user) {
          user.password = generatePassword(newPassword);
          await user.save();
          await user.reload();
          res.status(200).json({
            status: true,
            msg: "Thay đổi mật khẩu thành công!",
            code: "success"
          });
        } else {
          return res.status(200).json({
            status: false,
            msg: "Không tìm thấy tài khoản!"
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
    sendOtpUpdateBalance: async (req, res) => {
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

      const user = await findByID(id);
      if (!user) return res.status(200).json({
        status: false,
        msg: "Không tìm thấy người dùng này!",
        code: 400
      });

      const REDIS_KEY = `otp_update_balance:${id}`;

      const checkRedis = await redis.get(REDIS_KEY);
      if (!checkRedis) {
        const code = Helper.getRandomInt(100000, 999999);
        redis.setex(REDIS_KEY, 30, { code });

        const botTeleConfig = JSON.parse(fs.readFileSync(process.env.PWD + "/src/configs/telegram/bot.json", "utf8"));
        const chatTeleConfig = JSON.parse(fs.readFileSync(process.env.PWD + "/src/configs/telegram/chatGroup.json", "utf8"));
        const messageTeleConfig = JSON.parse(fs.readFileSync(process.env.PWD + "/src/configs/telegram/message.json", "utf8"));

        // thông báo telegram
        if (botTeleConfig.status) {
          teleBotSendMsg(chatTeleConfig.otpUpdateBalance, messageTeleConfig.otpUpdateBalance, {
            '{{code}}': code,
            '{{username}}': user.username
          });
        }

        return res.status(200).json({
          status: true,
          msg: "Đã gửi mã!"
        });
      } else {
        return res.status(200).json({
          status: false,
          msg: "OTP Code chưa hết hạn!"
        });
      }
    }
  }
};
