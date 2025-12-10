const moment = require('moment-timezone');
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
const { AgencyModel } = require("@Models/Agency/Agency");
const { AgencyRefModel } = require("@Models/Agency/AgencyRef");
const {
    getAgencyInfoByUser,
    getLevelOfAgency,
    getUplineAgency,
    getCurrentAgencyList,
    getCurrentUserList,
    getUserAndAgencyList,
    getCurrentTreeArrayByAgency
} = require("@Models/Agency/AgencyHelper");
const { BankUserModel } = require("@Models/Bank/BankUser");
const { BankHistoryModel } = require("@Models/Bank/BankHistory");
const { BetHistoryModel } = require("@Models/Bet/BetHistory");
const { BetRefurnModel } = require("@Models/Bet/BetRefurn");
const { UserIncentiveModel } = require("@Models/User/UserIncentive");
const { UserIncentiveDonateModel } = require("@Models/User/UserIncentiveDonate");
const { WithdrawConditionModel } = require("@Models/Withdraw/WithdrawCondition");
const { UserDeviceModel } = require("@Models/User/UserDevice");

module.exports = {
    getLevelListAgency: async (req, res) => {
        try {
            const masterAgentId = req.params.id;

            res.status(200).json(await getCurrentAgencyList(masterAgentId, true));
        } catch (e) {
            console.log(e);
            res.status(200).json({
                status: false,
                msg: e.message,
                code: 500
            });
        }
    },
    listAgency: async (req, res) => {
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

                // const getTheAgencyLevelLine =

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
                if (!!req.query.code) {
                    //assocScopes.push({ method: ['byAgencyCode', req.query.code] });
                }

                assocScopes.push(
                    { method: ['withUserInfo'] },
                    { method: ['withRoleAgency'] },
                    //{ method: ['withRoleUser'] }
                );

                const total = await AgencyRefModel.scope(assocScopes).count({ where: match });

                let getUsers = await AgencyRefModel.scope(assocScopes).findAll({
                    where: match,
                    offset: 0 + (page - 1) * kmess,
                    limit: kmess,
                    order: [["id", "ASC"]],
                    attributes: { exclude: ["password", "deletedAt"] }
                });

                function getAgencyInfo() {
                    return new Promise(async (resolve, reject) => {
                        var i = 1;
                        for (const user of getUsers) {
                            user.setDataValue('level', i);
                            user.setDataValue('AgencyInfo', await AgencyModel.findOne({ where: { uid: user.userInfo.id } }));
                        };
                        resolve(getUsers);
                    });
                }

                function getBankUser() {
                    return new Promise(async (resolve, reject) => {
                        for (const user of getUsers) {
                            user.setDataValue('userBank',
                            await BankUserModel.findOne({ 
                              where: { uid: user.userInfo.id }, 
                              attributes: { exclude: ["deletedAt", "updatedAt", "uid", "id"] },
                              order: [["id", "DESC"]],
                            }));
                        };
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
                    getAgencyInfo(),
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
    listAgencyByAgencyId: async (req, res) => {
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
                match.agency = req.params.agencyId;

                // const getTheAgencyLevelLine =

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
                if (!!req.query.code) {
                    //assocScopes.push({ method: ['byAgencyCode', req.query.code] });
                }

                assocScopes.push(
                    { method: ['withUserInfo'] },
                    { method: ['withRoleAgency'] },
                    //{ method: ['withRoleUser'] }
                );

                const total = await AgencyRefModel.scope(assocScopes).count({ where: match });

                let getUsers = await AgencyRefModel.scope(assocScopes).findAll({
                    where: match,
                    offset: 0 + (page - 1) * kmess,
                    limit: kmess,
                    order: [["id", "ASC"]],
                    attributes: { exclude: ["password", "deletedAt"] },
                });

                var i = 1;
                for (const user of getUsers) {
                    user.setDataValue('level', i);
                    user.setDataValue('AgencyInfo', await AgencyModel.findOne({ where: { uid: user.userInfo.id } }));
                };

                res.status(200).json({
                    status: true,
                    data: {
                        dataExport: getUsers,
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
    deleteAgency: async (req, res) => {
        try {
            return res.status(200).json({
                status: false,
                msg: "Hành động không được phép!"
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
    AgencyInfo: async (req, res) => {
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

            //withAgencyInfo
            const user = await UserModel.scope({ method: ['withAgencyInfo'] }).findOne({
                where: { id, role: UserModel.ROLE_ENUM.AGENCY },
                attributes: { exclude: ["password", "role", "deletedAt"] },
                include: [
                    {
                        model: BankUserModel,
                        as: "BankUser",
                        attributes: { exclude: ["deletedAt"] }
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
                    msg: "Agency not found!"
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
    countRefererUser: async (req, res) => {
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
            const agencyData = await AgencyModel.findOne({
                where: { uid: id },
            });
            const countRefUser = await AgencyRefModel.count({
                where: {
                    agency: agencyData.id
                }
            });

            res.status(200).json({
                status: true,
                count: countRefUser,
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
    countRefererUserToday: async (req, res) => {
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
            const agencyData = await AgencyModel.findOne({
                where: { uid: id },
            });
            const countRefUser = await AgencyRefModel.count({
                where: {
                    agency: agencyData.id,
                    createdAt: {
                        [Op.between]: [moment().startOf('days').format(), moment().endOf('days').format()]
                    }
                },
            });

            res.status(200).json({
                status: true,
                count: countRefUser,
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
    calculatorProfit: async (req, res) => {
        try {
            let { id } = req.params;
            let { from, to } = req.query;

            let timeStart, timeEnd;
            if (!!from && !!to) {
                timeStart = moment(from, "DD/MM/YYYY").startOf('day');
                timeEnd = moment(to, "DD/MM/YYYY").endOf('day');
            } else {
                timeStart = moment().startOf('day');
                timeEnd = moment().endOf('day');
            }

            if (!id) return res.status(200).json({
                status: false,
                msg: "Missing Param ID"
            });
            if (!Number(id) >> 0) return res.status(200).json({
                status: false,
                msg: "Err ID"
            });

            const agencyData = await AgencyModel.findOne({
                where: { uid: id },
                include: [
                    {
                        model: UserModel,
                        as: "userInfo",
                        attributes: { exclude: ["password", "deletedAt", "code", "status", "role", "updatedAt"] },
                    }
                ]
            });

            const totalUsers = await AgencyRefModel.findAll({
                where: { agency: agencyData.id },
                include: [
                    {
                        model: UserModel.scope('withRoleUser'),
                        as: "userInfo",
                        attributes: { exclude: ["password", "deletedAt", "code", "status", "role", "updatedAt"] },
                    }
                ]
            });

            let listUserRefMe = [];
            totalUsers.forEach((refUser) => {
                listUserRefMe.push(refUser.userInfo.id);
            });

            let listUserRef = [];
            listUserRef.push(agencyData.userInfo.id); // chứa id của đại lý gốc và id của thành viên đại lý gốc
            listUserRef = [...listUserRef, ...listUserRefMe, ...await getCurrentAgencyList(agencyData.id)]; // lấy danh sách uid ref dưới đại lý tính cả player và agency
            /****
             * listUserRef ban đầu đã chứa id của chính đại lý đang tham chiếu
             * listUserRef được push thêm listUserRefMe = danh sách id người chơi của chính đại lý đang tham chiếu
             * listUserRef cuối cùng được push thêm getCurrentAgencyList() = danh sách id đại lý cấp dưới và id người chơi của chính đại lý đang tham chiếu
             */
            let taskPromise = [];

            for (const userId of listUserRef) taskPromise.push(
                await UserModel.findOne({
                    where: { id: userId },
                    attributes: { exclude: ["password", "deletedAt", "code", "status", "updatedAt"] }
                })
            );
            const getListUserDownline = await Promise.allSettled(taskPromise);

            let listUserDownline = [];
            for (const userPromise of getListUserDownline) {
                if (userPromise.status == "fulfilled") listUserDownline.push(userPromise.value);
            }

            let TAG_ENUM = {
                ROOT_AGENCY: "root_agency",
                ROOT_AGENCY_USER: "root_agency_user",
                CHILDREN_AGENCY: "children_agency",
                CHILDREN_AGENCY_USER: "children_agency_user"
            };

            let exportData = [];

            const PromiseTask = await Promise.allSettled(
                listUserDownline.map(async (userRef) => {
                    return new Promise(async (resolve, reject) => {
                        let itemObj = {};
                        itemObj.userInfo = userRef;
                        itemObj.agencyLevel = 0;

                        itemObj.uplineAgency = [];
                        if (itemObj.userInfo.role == UserModel.ROLE_ENUM.AGENCY) {
                            itemObj.uplineAgency = await getUplineAgency(userRef.id);
                            itemObj.agencyLevel = itemObj.uplineAgency.length;
                        }

                        itemObj.tag = null;
                        itemObj.parentAgency = null;
                        itemObj.parentAgency = await getAgencyInfoByUser(itemObj.userInfo.id);

                        if (itemObj.userInfo.id == agencyData.userInfo.id) { // nếu người dùng chính là agency đang tham chiếu
                            itemObj.tag = TAG_ENUM.ROOT_AGENCY;
                        } else { // nếu người dùng không phải là agency đang tham chiếu
                            if (itemObj.uplineAgency.length == 0) {
                                itemObj.tag = (itemObj.parentAgency.id == agencyData.userInfo.id) ? TAG_ENUM.ROOT_AGENCY_USER : TAG_ENUM.CHILDREN_AGENCY_USER;
                            } else {
                                if (itemObj.uplineAgency.length > 1) {
                                    itemObj.tag = TAG_ENUM.CHILDREN_AGENCY;
                                }
                            }
                        }

                        let match = {};
                        match.uid = userRef.id;
                        match.createdAt = {
                            [Op.between]: [timeStart.format(), timeEnd.format()]
                        }

                        const getBetRecord = await BetHistoryModel.findAll({
                            where: match,
                            attributes: {
                                exclude: ['uid', 'username', 'updatedAt', 'deletedAt']
                            },
                            order: [["id", "DESC"]],
                        });
                        itemObj.betRecord = getBetRecord;

                        // chỉ lấy record success
                        match.status = BankHistoryModel.STATUS_ENUM.SUCCESS;

                        match.type = BankHistoryModel.TYPE_ENUM.RECHARGE;
                        const getDepositRecord = await BankHistoryModel.findAll({
                            where: match,
                            attributes: ['amount', 'is_first', 'createdAt'],
                            order: [["id", "DESC"]],
                        });
                        itemObj.depositRecord = getDepositRecord;

                        match.type = BankHistoryModel.TYPE_ENUM.CASHOUT;
                        const getWithdrawRecord = await BankHistoryModel.findAll({
                            where: match,
                            attributes: ['amount', 'is_first', 'createdAt'],
                            order: [["id", "DESC"]],
                        });
                        itemObj.withdrawRecord = getWithdrawRecord;

                        const getBetRefurn = await BetRefurnModel.findAll({
                            where: {
                                uid: userRef.id,
                                createdAt: {
                                    [Op.between]: [timeStart.format(), timeEnd.format()]
                                }
                            }
                        });
                        itemObj.betRefurnRecord = getBetRefurn;

                        const getIncentive = await UserIncentiveModel.findAll({
                            where: {
                                uid: userRef.id,
                                createdAt: {
                                    [Op.between]: [timeStart.format(), timeEnd.format()]
                                }
                            },
                        });
                        itemObj.incentiveRecord = getIncentive;

                        const getIncentiveDonate = await UserIncentiveDonateModel.findAll({
                            where: { uid: userRef.id },
                        });
                        itemObj.incentiveDonateRecord = getIncentiveDonate;


                        const getWithdrawCondi = await WithdrawConditionModel.findOne({
                            where: { uid: userRef.id }
                        });
                        itemObj.withdrawCondi = getWithdrawCondi;

                        const getUserDevice = await UserDeviceModel.findOne({
                            where: { uid: userRef.id }
                        });
                        itemObj.device = getUserDevice;

                        exportData.push(itemObj);

                        resolve(true);
                    });
                })
            );


            // for (var userRef of listUserDownline) {
            //     exportData[arrCursor] = {};

            //     exportData[arrCursor].userInfo = userRef;

            //     let match = {};
            //     match.uid = userRef.id;
            //     match.createdAt = {
            //         [Op.between]: [timeStart.format(), timeEnd.format()]
            //     }

            //     const getBetRecord = await BetHistoryModel.findAll({
            //         where: match,
            //         attributes: {
            //             exclude: ['uid', 'username', 'updatedAt', 'deletedAt']
            //         },
            //         order: [["id", "DESC"]],
            //     });
            //     exportData[arrCursor].betRecord = getBetRecord;

            //     // chỉ lấy record success
            //     match.status = BankHistoryModel.STATUS_ENUM.SUCCESS;

            //     match.type = BankHistoryModel.TYPE_ENUM.RECHARGE;
            //     const getDepositRecord = await BankHistoryModel.findAll({
            //         where: match,
            //         attributes: ['is_first', 'amount', 'createdAt'],
            //         order: [["id", "DESC"]],
            //     });
            //     exportData[arrCursor].depositRecord = getDepositRecord;

            //     match.type = BankHistoryModel.TYPE_ENUM.CASHOUT;
            //     const getWithdrawRecord = await BankHistoryModel.findAll({
            //         where: match,
            //         attributes: ['is_first', 'amount', 'createdAt'],
            //         order: [["id", "DESC"]],
            //     });
            //     exportData[arrCursor].withdrawRecord = getWithdrawRecord;

            //     const getBetRefurn = await BetRefurnModel.findAll({
            //         where: {
            //             uid: userRef.id,
            //             createdAt: {
            //                 [Op.between]: [timeStart.format(), timeEnd.format()]
            //             }
            //         }
            //     });
            //     exportData[arrCursor].betRefurnRecord = getBetRefurn;

            //     const getIncentive = await UserIncentiveModel.findAll({
            //         where: {
            //             uid: userRef.id,
            //             createdAt: {
            //                 [Op.between]: [timeStart.format(), timeEnd.format()]
            //             }
            //         },
            //     });
            //     exportData[arrCursor].incentiveRecord = getIncentive;

            //     arrCursor++;
            // }

            return res.status(200).json({
                status: true,
                agency: agencyData,
                totalUsers,
                // totalUserRefCoin,
                data: exportData,
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
            return res.status(200).json({
                status: false,
                msg: "Hành động không được phép!"
            });
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

                const { name, username, code, email, phone, coin, status, verify, role } = req.body;

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

                    await user.save();
                    await user.reload();

                    const agency = await AgencyModel.findOne({
                        where: { uid: user.id }
                    });

                    if (!!agency) {
                        agency.code = code;
                        await agency.save();
                        await agency.reload();
                    }

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
