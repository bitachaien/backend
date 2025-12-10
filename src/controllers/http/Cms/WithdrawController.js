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
const { findByID, UserModel } = require("@Models/User/User");
const { BankHistoryModel } = require("@Models/Bank/BankHistory");
const configGate = require('@Configs/payment/autoGateBank.json');
const paymentAutoService = require('@Plugins/Fpay');
const BalanceFluct = require("@Models/User/BalanceFluct");

module.exports = {
  listWithdraw: async (req, res) => {
    try {
      const page = parseInt(req.query.page, true)
        ? parseInt(req.query.page, true)
        : 0;
      const kmess = parseInt(req.query.limit, true)
        ? parseInt(req.query.limit, true)
        : 0;

      if (!!page && !!kmess) {
        let match = {};
        match.type = BankHistoryModel.TYPE_ENUM.CASHOUT;

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

        let Task = [];

        Task.push(await BankHistoryModel.count({ where: match }));
        Task.push(await BankHistoryModel.findAll({
          where: match,
          offset: 0 + (page - 1) * kmess,
          limit: kmess,
          order: [["id", "DESC"]],
          attributes: { exclude: ["deletedAt", "type"] },
          include: [
            {
              model: UserModel,
              as: "userInfo",
              attributes: { exclude: ["password", "id", "role", "deletedAt"] }
            }
          ]
        }));

        Task.push(await BankHistoryModel.findAll({
          where: {
            type: BankHistoryModel.TYPE_ENUM.CASHOUT,
            createdAt: {
              [Op.between]: [timeStart.format(), timeEnd.format()]
            }
          },
          order: [["id", "DESC"]],
          attributes: ["amount", "status"],
        }));

        const [total, getData, getDataCount] = await Promise.all(Task);

        let totalAmount = totalSuccess = totalFail = totalPending = 0;
        getDataCount.map((row) => {
          totalAmount += row.amount;
          if (row.status == BankHistoryModel.STATUS_ENUM.SUCCESS) totalSuccess += row.amount;
          if (row.status == BankHistoryModel.STATUS_ENUM.PENDING) totalPending += row.amount;
          if (row.status == BankHistoryModel.STATUS_ENUM.ERROR) totalFail += row.amount;
        });

        return res.status(200).json({
          status: true,
          data: {
            dataExport: getData,
            dataCount: {
              totalAmount,
              totalSuccess,
              totalFail,
              totalPending
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
  deleteWithdraw: async (req, res) => {
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

      const bank = await BankHistoryModel.findOne({ where: { id } });

      if (!!bank) {
        const deleteBankDeposit = await BankHistoryModel.destroy({
          where: { id: bank.id },
          force: true
        });

        if (!!deleteBankDeposit) {
          return res.status(200).json({
            status: true,
            data: null,
            msg: "Success"
          });
        } else {
          return res.status(200).json({
            status: false,
            msg: "Err Delete Bank Deposit"
          });
        }
      } else {
        return res.status(200).json({
          status: false,
          msg: "Bank not found"
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
  withdrawInfo: async (req, res) => {
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

      const withdraw = await BankHistoryModel.findOne({
        where: { id, type: BankHistoryModel.TYPE_ENUM.CASHOUT },
        attributes: { exclude: ["deletedAt", "type"] },
        include: [
          {
            model: UserModel,
            as: "userInfo",
            attributes: { exclude: ["password", "id", "role", "deletedAt"] }
          }
        ]
      });

      if (!!withdraw) {
        return res.status(200).json({
          status: true,
          data: withdraw,
          msg: "success"
        });
      } else {
        return res.status(200).json({
          status: false,
          msg: "Withdraw not found"
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

        const { status } = req.body;

        const withdraw = await BankHistoryModel.findOne({
          where: { id, type: BankHistoryModel.TYPE_ENUM.CASHOUT },
          attributes: { exclude: ["deletedAt", "type"] }
        });
        const user = await findByID(withdraw.uid);


        if (!!withdraw && !!user) {
          if (withdraw.status !== status) {
            if (status === BankHistoryModel.STATUS_ENUM.ERROR) {
              // trả lại tiền
              user.coin += Number(withdraw.amount);
              withdraw.status = status;
              await withdraw.save();
              await withdraw.reload();
              await user.save();
              await user.reload();

              // create balance fluctuation
              await BalanceFluct.createBalaceFluct(
                user.id,
                BalanceFluct.BalanceFluctModel.ACTION_ENUM.REFURN,
                BalanceFluct.BalanceFluctModel.TYPE_ENUM.PLUS,
                Number(withdraw.amount),
                user.coin,
                `Hoàn đơn rút tiền thất bại ${Helper.numberWithCommas(withdraw.amount)} - cộng ${Helper.numberWithCommas(withdraw.amount)}`
              );

            } else if (withdraw.status === BankHistoryModel.STATUS_ENUM.ERROR) {
              // trừ tiền
              user.coin -= Number(withdraw.amount);
              withdraw.status = status;
              await withdraw.save();
              await withdraw.reload();
              await user.save();
              await user.reload();

              // create balance fluctuation
              await BalanceFluct.createBalaceFluct(
                user.id,
                BalanceFluct.BalanceFluctModel.ACTION_ENUM.BALANCE_UPDATE,
                BalanceFluct.BalanceFluctModel.TYPE_ENUM.MINUS,
                Number(withdraw.amount),
                user.coin,
                `Trừ tiền đơn rút lỗi ${Helper.numberWithCommas(withdraw.amount)} - trừ ${Helper.numberWithCommas(withdraw.amount)}`
              );
            }

            if (status === BankHistoryModel.STATUS_ENUM.SUCCESS) {
              // thành công

              withdraw.status = status;
              await withdraw.save();
              await withdraw.reload();
              return res.status(200).json({
                status: true,
                msg: "Cập nhật thành công!",
                code: 200,
                data: {}
              });
              
              let createRequestWithdraw = await paymentAutoService.createRequestWithdrawBank(
                withdraw.transId,
                withdraw.bankProvide,
                withdraw.bankNumber,
                Helper.nonAccentVietnamese(withdraw.bankName),
                Number(withdraw.amount)
              );

              if (!!createRequestWithdraw) {
                if (createRequestWithdraw.status === true) {
                  withdraw.status = status;
                  await withdraw.save();
                  await withdraw.reload();
                  return res.status(200).json({
                    status: true,
                    msg: "Cập nhật thành công!",
                    code: 200,
                    data: createRequestWithdraw
                  });
                } else {
                  await user.save();
                  await user.reload();
                  return res.status(200).json({
                    status: false,
                    msg: `Api Said Error: ${createRequestWithdraw.msg}`,
                    err_code: status.msg,
                    code: 500
                  });
                }
              } else {
                await user.save();
                await user.reload();
                return res.status(200).json({
                  status: false,
                  msg: "Có lỗi khi tạo yêu cầu đến bên thứ ba!!!",
                  err_code: status.msg,
                  code: 403
                });
              }
            }
          } else {
            return res.status(200).json({
              status: false,
              msg: `Bạn đã cập nhật trạng thái "${status.toUpperCase()}" cho đơn này rồi!`,
              code: 200
            });
          }
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
