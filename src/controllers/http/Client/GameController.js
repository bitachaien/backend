const {
  ERROR_PAGE,
  ERROR_FORM,
  ERROR_AUTH,
  ERROR_AUTH_MESSAGE,
  ERROR_MESSAGES
} = require("@Helpers/contants");
const moment = require("moment-timezone");
moment.tz.setDefault("Asia/Ho_Chi_Minh");
const { Op } = require("sequelize");
const Helper = require("@Helpers/helpers");
const { parseInt } = require("@Helpers/Number");
const config = require("@Config");
const TcgService = require("@Plugins/TcgService");
const { BetHistoryModel } = require("@Models/Bet/BetHistory");
const { BetRefurnModel } = require("@Models/Bet/BetRefurn");
const BetRefurnConfig = require("@Configs/game/betRefurn.json");

const { findByID, findByUsername, UserModel } = require("@Models/User/User");
const BalanceFluct = require("@Models/User/BalanceFluct");
const { WithdrawConditionModel } = require("@Models/Withdraw/WithdrawCondition");

const { ApiConfigModel } = require("@Models/GameApi/ApiConfig");
const { ApiProductConfigModel } = require("@Models/GameApi/ApiProductConfig");
const { ApiGameConfigModel } = require("@Models/GameApi/ApiGameConfig");

const calculateRefundFromValidBet = (gameCategory, totalValidBetAmount) => {
  const normalizedCategory = (gameCategory || "OTHER").toUpperCase();
  const totalVnd = Number(totalValidBetAmount || 0);
  let percentReturn = 0;

  if (totalVnd >= 100000000) {
    percentReturn = BetRefurnConfig.BET_100000000[normalizedCategory] || 0;
  } else if (totalVnd >= 50000000) {
    percentReturn = BetRefurnConfig.BET_50000000[normalizedCategory] || 0;
  } else if (totalVnd >= 10000000) {
    percentReturn = BetRefurnConfig.BET_10000000[normalizedCategory] || 0;
  } else if (totalVnd >= 5000000) {
    percentReturn = BetRefurnConfig.BET_5000000[normalizedCategory] || 0;
  } else if (totalVnd >= 1000000) {
    percentReturn = BetRefurnConfig.BET_1000000[normalizedCategory] || 0;
  } else {
    percentReturn = BetRefurnConfig.BET_LESS_1000000[normalizedCategory] || 0;
  }

  const amountReturn = (Number(totalValidBetAmount || 0) / 100) * percentReturn;
  return {
    percentReturn,
    amountReturn: Number(amountReturn.toFixed(3))
  };
};

module.exports = {
  subnames: async (req, res) => {
    try {
      const listProduct = await ApiProductConfigModel.getAllProductCode();
      res.status(200).json({
        status: true,
        data: listProduct.sort(),
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
  launchGame: async (req, res) => {
    try {
      const { code, platform } = req.query;

      if (!code) return res
        .status(200)
        .json({ status: false, msg: "Error Missing Params!" });

      const getGameConfig = await ApiGameConfigModel.getGameByCode(code);
      if (!getGameConfig) return res
        .status(200)
        .json({ status: false, msg: "Không tìm thấy trò chơi này trên hệ thống!" });

      const getProduct = await ApiProductConfigModel.getProductByType(getGameConfig.product_type);
      if (!getProduct) return res
        .status(200)
        .json({ status: false, msg: "Không tìm thấy nhà cung cấp cho trò chơi này!" });

      const getApiConfig = await ApiConfigModel.getApiConfigByName(getProduct.product_api);
      if (!getApiConfig) return res
        .status(200)
        .json({ status: false, msg: "Không tìm cấu hình API cho nhà cung cấp này!" });

      let getGame = null;
      let platformClient = platform == "mobile" ? "html5" : "html5-desktop";
      let platformClientLottery = platform == "mobile" ? "MOBILE" : "WEB";
      let backUrl = platform == "mobile" ? `https://m.${config.SITE_DOMAIN}` : `https://www.${config.SITE_DOMAIN}`;

      if (getGameConfig.game_type == ApiGameConfigModel.GAME_TYPE.ELOTTO) { // xoso
        // get play game data
        let getLaunchGameParams = {
          username: req.user.username,
          product_type: getProduct.product_type,
          game_mode: "1",
          game_code: "lobby",
          lottery_bet_mode: "Elott",
          view: "lobby",
          language: "VI",
          back_url: backUrl,
          platform: platformClientLottery,
          method: 'lg',
        };
        const tcgService = new TcgService(getApiConfig.api_config);
        getGame = await tcgService.postAPI(getLaunchGameParams);
      } else {
        const tcgService = new TcgService(getApiConfig.api_config);
        getGame = await tcgService.getLaunchGame(
          req.user.username,
          getProduct.product_type,
          getProduct.product_mode,
          getGameConfig.game_code,
          platformClient
        );
      }

      if (getGame) {
        if (getGame.status == 0) {
          // update game play count
          try {
            getGameConfig.play_count += 1;
            getGameConfig.save();
            getGameConfig.reload();
          } catch (e) { }

          let playUrl = getGameConfig.game_type == ApiGameConfigModel.GAME_TYPE.ELOTTO ? `https://lottery.${config.SITE_DOMAIN}/${getGame.game_url}` : getGame.game_url;
          return res.status(200).json({
            status: true,
            data: { playUrl },
            msg: "success",
            code: 200
          });
        } else {
          return res.status(200).json({
            status: false,
            msg: getGame.error_desc,
            code: 3812,
            detail: getGame
          });
        }
      } else {
        return res.status(200).json({
          status: false,
          msg: `Khởi chạy trò chơi thất bại!`,
          code: 49532,
          detail: "Error Get Launcher"
        });
      }

    } catch (e) {
      console.log(e);
      return res.status(200).json({
        status: false,
        msg: e.message,
        code: "err_exception"
      });
    }
  },
  wallets: async (req, res) => {
    try {
      const { id } = req.params;
      if (!id) return res
        .status(200)
        .json({ status: false, msg: "Error Missing Param ID!" });

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
        req.user.username,
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
  history: async (req, res) => {
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
        const defaultFrom = moment().subtract(29, "days").format("DD/MM/YYYY");
        const from = (req.query.from) ? req.query.from : defaultFrom;
        const to = (req.query.to) ? req.query.to : moment().format("DD/MM/YYYY");
        match.createdAt = {
          [Op.between]: [moment(from, "DD/MM/YYYY").startOf("days").format(), moment(to, "DD/MM/YYYY").endOf("days").format()]
        };

        // filter
        if (!!req.query.gameCategory) {
          match.gameCategory = req.query.gameCategory;
        }

        if (!!req.query.status) {
          match.status = req.query.status;
        }

        const total = await BetHistoryModel.count({ where: match });
        const getData = await BetHistoryModel.findAll({
          where: match,
          offset: 0 + (page - 1) * kmess,
          limit: kmess,
          order: [["betTime", "DESC"]],
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
        msg: e.message,
        code: 500
      });
    }
  },
  betRefurn: async (req, res) => {
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
        const from = (req.query.from) ? req.query.from : moment().startOf("year").format("DD/MM/YYYY");
        const to = (req.query.to) ? req.query.to : moment().format("DD/MM/YYYY");
        match.createdAt = {
          [Op.between]: [moment(from, "DD/MM/YYYY").startOf("days").format(), moment(to, "DD/MM/YYYY").endOf("days").format()]
        };

        // filter
        if (!!req.query.gameCategory) {
          match.gameCategory = req.query.gameCategory;
        }

        const total = await BetRefurnModel.count({ where: match });
        const getRawData = await BetRefurnModel.findAll({
          where: match,
          offset: 0 + (page - 1) * kmess,
          limit: kmess,
          order: [["createdAt", "DESC"]],
          attributes: { exclude: ["deletedAt"] }
        });

        const getData = getRawData.map(record => record.toJSON());

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
  returnPointAllToProvider: async (req, res) => {
    try {
      const listProductCode = await ApiProductConfigModel.getAllProductCode();

      let listPromise = [];
      for (const productCode of listProductCode) {
        const getProductConfig = await ApiProductConfigModel.getProductByCode(productCode);
        if (!getProductConfig) continue;
        const getApiConfig = await ApiConfigModel.getApiConfigByName(getProductConfig.product_api);
        if (!getApiConfig) continue;

        const tcgService = new TcgService(getApiConfig.api_config);
        listPromise.push(await tcgService.userFullTransfer(
          req.user.username,
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
      const user = await findByID(req.user.id);
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
          `Thu hồi ${Helper.numberWithCommas(totalPoint)} điểm về tài khoản chính - cộng ${Helper.numberWithCommas(amountUpdate)}`
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
  walletTransfer: async (req, res) => {
    try {
      // const { amount, type, transferType, password } = req.body;
      // if (!amount || !type || !transferType || !password) {
      //   return res
      //     .status(200)
      //     .json({ status: false, msg: "Error Missing Param!" });
      // }

      // // Check Password 
      // const currentMd5Pass = await UserModel.findOne({ where: { id: req.user.id }, attributes: ["password"] });
      // if (!validatePassword(password, currentMd5Pass.password)) {
      //   return res.status(200).json({
      //     status: false,
      //     msg: ERROR_AUTH.PASSWORD_INVALID,
      //     code: 1
      //   });
      // }

      const { amount, type, transferType } = req.body;
      if (!amount || !type || !transferType) return res
        .status(200)
        .json({ status: false, msg: "Error Missing Param!" });

      const getProductConfig = await ApiProductConfigModel.getProductByType(String(type));
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

      if (Number(transferType) == 1) { // Chuyển qũy sang sảnh

        const amountOk = Helper.roundDownToThousand(Number(amount)); // số tiền làm tròn xuống là bội của 1000 96 000
        const amountCancel = Number(amount) - amountOk; // số tiền trả lại khách 400

        const user = await findByID(req.user.id);
        if (user.coin < amountOk) return res
          .status(200)
          .json({ status: false, msg: "Số dư của bạn không đủ!" });

        const amountTransfer = amountOk / 1000;

        const tcgService = new TcgService(getApiConfig.api_config);

        const transfer = await tcgService.userTransfer(
          user.username,
          getProductConfig.product_type,
          1,
          amountTransfer,
          Helper.randomInteger(100000000000, 999999999999) // transID
        );

        if (transfer) {
          if (transfer.status == 0) {
            user.coin -= amountOk;
            await user.save();
            await user.reload();

            // create balance fluctuation
            await BalanceFluct.createBalaceFluct(
              user.id,
              BalanceFluct.BalanceFluctModel.ACTION_ENUM.TRANSFER_WALLET,
              BalanceFluct.BalanceFluctModel.TYPE_ENUM.MINUS,
              amountOk,
              user.coin,
              `Nạp ${Helper.numberWithCommas(amountTransfer)} điểm vào ${getProductConfig.product_code} - trừ ${Helper.numberWithCommas(amountOk)}`
            );

            return res
              .status(200)
              .json({ status: true, user, msg: "Chuyển quỹ thành công!" });
          } else {
            console.log("Nạp Responsive : " + JSON.stringify(transfer));
            return res.status(200).json({
              status: false,
              msg: transfer.error_desc,
              code: 500
            });
          }
        } else {
          return res.status(200).json({
            status: false,
            msg: `Đã có lỗi bất ngờ xảy ra! Vui lòng thao tác lại...`,
            code: 500
          });
        }
      } else if (Number(transferType) == 2) {
        const amountUpdate = Math.floor(Number(amount) * 1000);

        const user = await findByID(req.user.id);

        const tcgService = new TcgService(getApiConfig.api_config);

        const withDraw = await tcgService.userTransfer(
          user.username,
          getProductConfig.product_type,
          2,
          Number(amount),
          Helper.randomInteger(100000000000, 999999999999) // transID
        );

        if (withDraw) {
          if (withDraw.status == 0) {
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
              `Rút ${Helper.numberWithCommas(amount)} điểm từ ${getProductConfig.product_code} - cộng ${Helper.numberWithCommas(amountUpdate)}`
            );

            return res
              .status(200)
              .json({ status: true, user, msg: "Rút quỹ thành công!" });
          } else {
            console.log("Rút Responsive : " + JSON.stringify(withDraw));
            return res.status(200).json({
              status: false,
              msg: withDraw.error_desc,
              code: 500
            });
          }
        } else {
          return res.status(200).json({
            status: false,
            msg: `Đã có lỗi bất ngờ xảy ra! Vui lòng thao tác lại...`,
            code: 500
          });
        }
      } else {
        return res.status(200).json({
          status: false,
          msg: `Đã có lỗi bất ngờ xảy ra! Vui lòng thao tác lại...`,
          code: 500
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

  balanceUpdate: async (req, res) => {
    try {
      const user = req.user;
      // lấy tổng số dư tcg
      if (user.isPlay == UserModel.IS_PLAY_ENUM.TRUE) {
        // const tcgTotalBalance = await getTotalBalance(user.username);
        // if (tcgTotalBalance.status) {
        //   // tcgTotalBalance.totalBalance
        //   await backupBalanceByUser(user.username);
        // }
      }
      res.status(200).json({
        status: true
      });
    } catch (e) {
      console.log(e);
      res.status(200).json({
        status: true
      });
    }
  },
  getBetRefundTotal: async (req, res) => {
    try {
      const userId = req.user.id;
      
      if (!userId) {
        return res.status(200).json({
          status: false,
          msg: "Không tìm thấy thông tin người dùng!",
          code: 401
        });
      }
      
      // Lấy tất cả các bản ghi hoàn trả PENDING (chưa nhận)
      const pendingRefunds = await BetRefurnModel.findAll({
        where: {
          uid: userId,
          status: BetRefurnModel.STATUS_ENUM.PENDING
        },
        order: [['createdAt', 'ASC']]
      });
      
      console.log(`[BetRefund] Found ${pendingRefunds.length} pending refund records for user ${userId}`);

      // Nhóm theo gameName từ các cược trong BetHistory và phân bổ số tiền hoàn trả
      const refundsByGame = {};
      let totalAmount = 0;

      // Với mỗi bản ghi hoàn trả PENDING, lấy các cược tương ứng từ BetHistory
      for (const refund of pendingRefunds) {
        try {
          // Xử lý timeFrom và timeTo
          let timeFrom = null;
          let timeTo = null;
          
          if (refund.timeFrom) {
            timeFrom = moment(refund.timeFrom).format("YYYY-MM-DD HH:mm:ss");
          }
          if (refund.timeTo) {
            timeTo = moment(refund.timeTo).format("YYYY-MM-DD HH:mm:ss");
          }
          
          const gameCategory = (refund.gameCategory || 'OTHER').toUpperCase();
          let refundAmount = parseFloat(refund.amountReturn || 0) || 0;
          let refundValidBet = parseFloat(refund.validBetAmount || 0) || 0;
          
          // Kiểm tra xem giá trị có bị chia cho 1000 không
          // Nếu refundAmount quá nhỏ so với refundValidBet (nhỏ hơn 0.1% - tỷ lệ hoàn trả tối thiểu),
          // và sau khi nhân 1000 thì tỷ lệ hợp lý hơn (ít nhất 0.1%), thì có thể đã bị chia cho 1000
          if (refundValidBet > 0 && refundAmount > 0) {
            const currentRatio = refundAmount / refundValidBet;
            const correctedValidBet = refundValidBet * 1000;
            const correctedAmount = refundAmount * 1000;
            const correctedRatio = correctedAmount / correctedValidBet;
            
            // Nếu tỷ lệ hiện tại quá nhỏ (< 0.1%) và tỷ lệ sau khi nhân 1000 hợp lý hơn (>= 0.1% và <= 5%)
            if (currentRatio < 0.001 && correctedRatio >= 0.001 && correctedRatio <= 0.05) {
              console.log(`[BetRefund] Detected refund values divided by 1000. Correcting: validBet ${refundValidBet} -> ${correctedValidBet}, amount ${refundAmount} -> ${correctedAmount}, ratio ${(currentRatio * 100).toFixed(4)}% -> ${(correctedRatio * 100).toFixed(4)}%`);
              refundValidBet = correctedValidBet;
              refundAmount = correctedAmount;
            }
          }

          console.log(`[BetRefund] Processing refund ${refund.id}: category=${gameCategory}, amount=${refundAmount}, timeFrom=${timeFrom}, timeTo=${timeTo}`);

          if (!timeFrom || !timeTo) {
            console.warn(`[BetRefund] Refund ${refund.id} missing timeFrom or timeTo, searching all bets for category`);
            // Nếu không có timeFrom/timeTo, tìm tất cả cược của gameCategory trong ngày hôm nay
            const todayStart = moment.tz('Asia/Ho_Chi_Minh').startOf('day').format("YYYY-MM-DD HH:mm:ss");
            const todayEnd = moment.tz('Asia/Ho_Chi_Minh').format("YYYY-MM-DD HH:mm:ss");
            timeFrom = todayStart;
            timeTo = todayEnd;
          }

          if (refundValidBet <= 0) {
            console.warn(`[BetRefund] Refund ${refund.id} has invalid validBetAmount: ${refundValidBet}`);
            continue;
          }

          // Lấy các cược trong khoảng thời gian này
          // Mở rộng tìm kiếm: nếu không tìm thấy trong khoảng chính xác, tìm trong ngày
          let bets = await BetHistoryModel.findAll({
            where: {
              uid: userId,
              gameCategory: gameCategory,
              betTime: {
                [Op.between]: [timeFrom, timeTo]
              }
            },
            attributes: ['gameName', 'validBetAmount', 'gameCategory']
          });

          // Nếu không tìm thấy, mở rộng tìm trong toàn bộ ngày
          if (bets.length === 0) {
            const todayStart = moment.tz('Asia/Ho_Chi_Minh').startOf('day').format("YYYY-MM-DD HH:mm:ss");
            const todayEnd = moment.tz('Asia/Ho_Chi_Minh').format("YYYY-MM-DD HH:mm:ss");
            console.log(`[BetRefund] No bets found in exact period, searching in whole day: ${todayStart} to ${todayEnd}`);
            bets = await BetHistoryModel.findAll({
              where: {
                uid: userId,
                gameCategory: gameCategory,
                betTime: {
                  [Op.between]: [todayStart, todayEnd]
                }
              },
              attributes: ['gameName', 'validBetAmount', 'gameCategory']
            });
          }

          console.log(`[BetRefund] Found ${bets.length} bets for refund ${refund.id} (category: ${gameCategory})`);

          // Tính tổng validBetAmount để phân bổ
          // Kiểm tra xem validBetAmount từ BetHistory có bị chia cho 1000 không
          // Nếu refundValidBet lớn (ví dụ 3,000,000) nhưng tổng validBet từ bets nhỏ (ví dụ 3,000), 
          // thì có thể đã bị chia cho 1000
          let totalValidBetInPeriod = 0;
          const betsByGame = {};
          
          bets.forEach(bet => {
            const gameName = bet.gameName || 'Không xác định';
            let validBet = parseFloat(bet.validBetAmount || 0) || 0;
            
            // Kiểm tra và sửa nếu giá trị bị chia cho 1000
            // Nếu refundValidBet >= 1000 và validBet < refundValidBet * 0.001, 
            // và validBet * 1000 hợp lý hơn, thì nhân lại 1000
            if (refundValidBet >= 1000 && validBet > 0 && validBet < refundValidBet * 0.001) {
              const correctedValidBet = validBet * 1000;
              if (correctedValidBet >= refundValidBet * 0.1 && correctedValidBet <= refundValidBet * 1.1) {
                console.log(`[BetRefund] Detected validBetAmount divided by 1000. Correcting: ${validBet} -> ${correctedValidBet}`);
                validBet = correctedValidBet;
              }
            }
            
            totalValidBetInPeriod += validBet;
            
            if (!betsByGame[gameName]) {
              betsByGame[gameName] = {
                gameName: gameName,
                validBetAmount: 0
              };
            }
            betsByGame[gameName].validBetAmount += validBet;
          });

          // Phân bổ số cược hợp lệ theo game và sẽ tính hoàn trả sau
          if (totalValidBetInPeriod > 0 && bets.length > 0) {
            Object.values(betsByGame).forEach(betGroup => {
              const gameName = betGroup.gameName;
              const gameValidBet = betGroup.validBetAmount; // Định dạng hiển thị
              
              if (!refundsByGame[gameName]) {
                refundsByGame[gameName] = {
                  gameName: gameName,
                  gameCategory: gameCategory,
                  totalValidBetAmount: 0,
                  totalAmountReturn: 0
                };
              }
              
              refundsByGame[gameName].totalValidBetAmount += gameValidBet;
            });
          } else if (bets.length === 0) {
            // Nếu vẫn không tìm thấy cược, tìm tất cả cược của gameCategory trong 7 ngày gần nhất
            console.warn(`[BetRefund] No bets found for refund ${refund.id}, searching last 7 days`);
            const sevenDaysAgo = moment.tz('Asia/Ho_Chi_Minh').subtract(7, 'days').format("YYYY-MM-DD HH:mm:ss");
            const now = moment.tz('Asia/Ho_Chi_Minh').format("YYYY-MM-DD HH:mm:ss");
            
            const allBets = await BetHistoryModel.findAll({
              where: {
                uid: userId,
                gameCategory: gameCategory,
                betTime: {
                  [Op.between]: [sevenDaysAgo, now]
                }
              },
              attributes: ['gameName', 'validBetAmount', 'gameCategory'],
              order: [['betTime', 'DESC']],
              limit: 100 // Giới hạn để tránh quá nhiều dữ liệu
            });
            
            if (allBets.length > 0) {
              // Phân bổ theo các cược tìm được
              let totalValidBetAll = 0;
              const betsByGameAll = {};
              
              allBets.forEach(bet => {
                const gameName = bet.gameName || 'Không xác định';
                let validBet = parseFloat(bet.validBetAmount || 0) || 0;
                
                // Kiểm tra và sửa nếu giá trị bị chia cho 1000
                if (refundValidBet >= 1000 && validBet > 0 && validBet < refundValidBet * 0.001) {
                  const correctedValidBet = validBet * 1000;
                  if (correctedValidBet >= refundValidBet * 0.1 && correctedValidBet <= refundValidBet * 1.1) {
                    console.log(`[BetRefund] Detected validBetAmount divided by 1000 (7 days search). Correcting: ${validBet} -> ${correctedValidBet}`);
                    validBet = correctedValidBet;
                  }
                }
                
                totalValidBetAll += validBet;
                
                if (!betsByGameAll[gameName]) {
                  betsByGameAll[gameName] = {
                    gameName: gameName,
                    validBetAmount: 0
                  };
                }
                betsByGameAll[gameName].validBetAmount += validBet;
              });
              
              if (totalValidBetAll > 0) {
                Object.values(betsByGameAll).forEach(betGroup => {
                  const gameName = betGroup.gameName;
                  const gameValidBet = betGroup.validBetAmount;
                  
                  if (!refundsByGame[gameName]) {
                    refundsByGame[gameName] = {
                      gameName: gameName,
                      gameCategory: gameCategory,
                      totalValidBetAmount: 0,
                      totalAmountReturn: 0
                    };
                  }
                  
                  refundsByGame[gameName].totalValidBetAmount += gameValidBet;
                });
              }
            } else {
              console.warn(`[BetRefund] No bets found for refund ${refund.id} even after searching 7 days. Skipping this refund.`);
            }
          }
        } catch (err) {
          console.error(`[BetRefund] Error processing refund ${refund.id}:`, err);
        }
      }
      
      console.log(`[BetRefund] Final refundsByGame:`, Object.keys(refundsByGame));

      // Chuyển object thành array và tính hoàn trả dựa trên tổng cược hợp lệ
      const refundsList = Object.values(refundsByGame);
      refundsList.forEach(item => {
        const { percentReturn, amountReturn } = calculateRefundFromValidBet(item.gameCategory, item.totalValidBetAmount);
        item.percentReturn = percentReturn;
        item.totalAmountReturn = amountReturn;
        totalAmount += amountReturn;
      });

      console.log(`[BetRefund] Returning ${refundsList.length} refund items, totalAmount: ${totalAmount}`);

      res.status(200).json({
        status: true,
        data: {
          totalAmount: totalAmount,
          count: refundsList.length,
          refundsByCategory: refundsList
        },
        msg: "SUCCESS",
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
  claimBetRefund: async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await findByID(userId);
      
      if (!user) {
        return res.status(200).json({
          status: false,
          msg: "Không tìm thấy người dùng!",
          code: 404
        });
      }

      // Lấy tất cả các bản ghi hoàn trả chưa nhận
      const pendingRefunds = await BetRefurnModel.findAll({
        where: {
          uid: userId,
          status: BetRefurnModel.STATUS_ENUM.PENDING
        }
      });

      if (pendingRefunds.length === 0) {
        return res.status(200).json({
          status: false,
          msg: "Không có tiền hoàn trả để nhận!",
          code: 200
        });
      }

      let totalAmountVnd = 0;
      const refundIdsToClaim = [];
      const refundsToUpdate = [];

      pendingRefunds.forEach(refund => {
        let amountRaw = parseFloat(refund.amountReturn || 0); // lưu theo VND
        const validBetAmount = parseFloat(refund.validBetAmount || 0);
        
        console.log(`[ClaimRefund] Refund ID ${refund.id}: amountReturn from DB = ${refund.amountReturn}, parsed = ${amountRaw}, validBetAmount = ${validBetAmount}`);
        
        if (amountRaw <= 0) {
          return;
        }

        // Kiểm tra xem giá trị có bị chia cho 1000 không
        // Nếu validBetAmount lớn (ví dụ 3,000,000) nhưng amountReturn nhỏ (ví dụ 19), 
        // và amountReturn * 1000 hợp lý hơn (ví dụ 19,000), thì nhân lại 1000
        if (validBetAmount >= 1000 && amountRaw < validBetAmount * 0.0001) {
          // Nếu amountReturn quá nhỏ so với validBetAmount (nhỏ hơn 0.01%), có thể đã bị chia cho 1000
          const correctedAmount = amountRaw * 1000;
          // Kiểm tra xem giá trị sau khi nhân 1000 có hợp lý không (ít nhất 0.1% của validBetAmount)
          if (correctedAmount >= validBetAmount * 0.001) {
            console.log(`[ClaimRefund] Detected amountReturn was divided by 1000. Correcting: ${amountRaw} -> ${correctedAmount}`);
            amountRaw = correctedAmount;
          }
        }

        const amountVnd = Math.floor(amountRaw);
        const remainingAmount = parseFloat((amountRaw - amountVnd).toFixed(6));

        if (amountVnd > 0) {
          totalAmountVnd += amountVnd;
        }

        if (remainingAmount > 0 && amountRaw > 0) {
          const ratio = remainingAmount / amountRaw;
          refundsToUpdate.push({
            id: refund.id,
            amountReturn: remainingAmount,
            validBetAmount: Number(refund.validBetAmount || 0) * ratio,
            betAmount: Number(refund.betAmount || 0) * ratio,
            winAmount: Number(refund.winAmount || 0) * ratio,
            netPnl: Number(refund.netPnl || 0) * ratio
          });
        } else if (amountVnd > 0) {
          refundIdsToClaim.push(refund.id);
        }
      });

      if (totalAmountVnd <= 0) {
        return res.status(200).json({
          status: false,
          msg: "Số tiền hoàn trả quá nhỏ, vui lòng đợi thêm các đơn khác!",
          code: 200
        });
      }

      // Cộng tiền vào số dư (quy đổi về VND)
      user.coin += totalAmountVnd;
      await user.save();

      // Cập nhật trạng thái các bản ghi hoàn trả thành CLAIMED
      // Cập nhật lại các bản ghi còn dư thập phân
      for (const refundUpdate of refundsToUpdate) {
        await BetRefurnModel.update(
          {
            amountReturn: refundUpdate.amountReturn,
            validBetAmount: refundUpdate.validBetAmount,
            betAmount: refundUpdate.betAmount,
            winAmount: refundUpdate.winAmount,
            netPnl: refundUpdate.netPnl
          },
          { where: { id: refundUpdate.id } }
        );
      }

      // Đánh dấu hoàn tất những bản ghi đã được nhận hết
      if (refundIdsToClaim.length > 0) {
        await BetRefurnModel.update(
          { status: BetRefurnModel.STATUS_ENUM.CLAIMED },
          { where: { id: { [Op.in]: refundIdsToClaim } } }
        );
      }

      // Cập nhật điều kiện rút tiền
      const userWithdrawCondition = await WithdrawConditionModel.findByUserId(userId);
      if (userWithdrawCondition) {
        userWithdrawCondition.totalMinimumBetAmount += totalAmountVnd;
        await userWithdrawCondition.save();
      }

      // Tạo bản ghi biến động số dư
      await BalanceFluct.createBalaceFluct(
        userId,
        BalanceFluct.BalanceFluctModel.ACTION_ENUM.BET_REFURN,
        BalanceFluct.BalanceFluctModel.TYPE_ENUM.PLUS,
        Number(totalAmountVnd),
        user.coin,
        `Nhận hoàn trả cược - cộng ${Helper.numberWithCommas(Number(totalAmountVnd))}`
      );

      res.status(200).json({
        status: true,
        data: {
          amountReceived: totalAmountVnd,
          newBalance: user.coin,
          count: pendingRefunds.length
        },
        msg: "Nhận hoàn trả thành công!",
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
  }
};
