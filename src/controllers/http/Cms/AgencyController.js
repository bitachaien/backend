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
const { generatePassword } = require("@Helpers/password");
const {
    findByUsername,
    findByEmail,
    findByID,
    UserModel
} = require("@Models/User/User");
const { UserDeviceModel } = require("@Models/User/UserDevice");
const { UserIncentiveModel } = require("@Models/User/UserIncentive");
const { UserIncentiveDonateModel } = require("@Models/User/UserIncentiveDonate");
const { AgencyModel } = require("@Models/Agency/Agency");
const { AgencyRefModel } = require("@Models/Agency/AgencyRef");
const { BankUserModel } = require("@Models/Bank/BankUser");
const { BankHistoryModel } = require("@Models/Bank/BankHistory");
const { BetHistoryModel } = require("@Models/Bet/BetHistory");
const { WithdrawConditionModel } = require("@Models/Withdraw/WithdrawCondition");
const { BetRefurnModel } = require("@Models/Bet/BetRefurn");

const {
    getAgencyInfoByUser,
    getLevelOfAgency,
    getUplineAgency,
    getCurrentAgencyList,
    getCurrentUserList,
    getUserAndAgencyList,
    getCurrentTreeArrayByAgency
} = require("@Models/Agency/AgencyHelper");

const listToTree = require("@Helpers/listToTree");

module.exports = {
    listAgency: async (req, res) => {
        try {
            const page = parseInt(req.query.page, true)
                ? parseInt(req.query.page, true)
                : 0;
            const kmess = parseInt(req.query.limit, true)
                ? parseInt(req.query.limit, true)
                : 0;
            let { from, to } = req.query;

            let timeStart, timeEnd;
            if (!!from && !!to) {
                timeStart = moment(from, "DD/MM/YYYY").startOf('day');
                timeEnd = moment(to, "DD/MM/YYYY").endOf('day');
            } else {
                timeStart = moment().startOf('day');
                timeEnd = moment().endOf('day');
            }

            const dateCheckFrom = moment.utc(timeStart).local().format("DDMMYYYY");
            const dateCheckTo = moment.utc(timeEnd).local().format("DDMMYYYY");

            if (!!page && !!kmess) {
                let match = {};
                let assocScopes = [];
                match.role = UserModel.ROLE_ENUM.AGENCY;

                // filter
                if (!!req.query.name) match.name = { [Op.like]: `%${req.query.name}%` };
                if (!!req.query.username) match.username = req.query.username;
                if (!!req.query.phone) match.phone = req.query.phone;
                if (!!req.query.email) match.email = req.query.email;
                if (!!req.query.code) assocScopes.push({ method: ['byAgencyCode', req.query.code] });

                const [total, getUsers] = await Promise.all([
                    await UserModel.scope(assocScopes).count({ where: match }),
                    await UserModel.scope(assocScopes).findAll({
                        where: match,
                        offset: 0 + (page - 1) * kmess,
                        limit: kmess,
                        order: [["id", "DESC"]],
                        attributes: { exclude: ["password", "deletedAt"] },
                        include: [
                            {
                                model: AgencyModel,
                                as: "AgencyInfo",
                                required: true
                            },
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
                    })
                ]);

                console.log(getUsers);

                let dataExport = [];

                await Promise.all(getUsers.map(async (userData) => {
                    /***
                     * Lấy thống kê người dùng hiện tại
                     */
                    let cacheUserData = userData;
                    cacheUserData.agencyLevel = await getLevelOfAgency(userData.id);
                    //cacheUserData.agencyLevel = null;
                    cacheUserData.totalDeposit = 0;
                    cacheUserData.totalWithdraw = 0;
                    cacheUserData.totalDepositCount = 0;
                    cacheUserData.totalWithdrawCount = 0;
                    cacheUserData.totalRefurn = 0;
                    cacheUserData.netPnl = 0;
                    cacheUserData.validBetAmount = 0;
                    cacheUserData.incentive = 0;
                    cacheUserData.incentiveDonate = 0;
                    cacheUserData.device = {};

                    async function getBank() {
                        const getBankHistory = await BankHistoryModel.findAll({
                            where: {
                                uid: userData.id,
                                status: BankHistoryModel.STATUS_ENUM.SUCCESS
                            },
                            attributes: ["type", "amount"]
                        });
                        getBankHistory.map((item) => {
                            if (item.type == BankHistoryModel.TYPE_ENUM.RECHARGE) {
                                cacheUserData.totalDepositCount++;
                                cacheUserData.totalDeposit += item.amount
                            };
                            if (item.type == BankHistoryModel.TYPE_ENUM.CASHOUT) {
                                cacheUserData.totalWithdrawCount++;
                                cacheUserData.totalWithdraw += item.amount;
                            };
                        });
                    }

                    async function getBetRefurn() {
                        const getBetRefurnx = await BetRefurnModel.findAll({
                            where: {
                                uid: userData.id
                            },
                            attributes: ["amountReturn"]
                        });
                        getBetRefurnx.map((item) => {
                            cacheUserData.totalRefurn += item.amountReturn;
                        });
                    }

                    async function getBetHistory() {
                        const getBetHistoryx = await BetHistoryModel.findAll({
                            where: {
                                uid: userData.id
                            },
                            attributes: ["netPnl", "validBetAmount"]
                        });
                        getBetHistoryx.map((item) => {
                            cacheUserData.netPnl += item.netPnl * 1000;
                            cacheUserData.validBetAmount += item.validBetAmount * 1000;
                        });
                    }

                    async function getIncentive() {
                        const getIncentivex = await UserIncentiveModel.findAll({ where: { uid: userData.id } });
                        getIncentivex.map((item) => {
                            cacheUserData.incentive += item.amount;
                        });
                    }

                    async function getIncentiveDonate() {
                        const getIncentiveDonatex = await UserIncentiveDonateModel.findAll({ where: { uid: userData.id } });
                        getIncentiveDonatex.map((item) => {
                            cacheUserData.incentiveDonate += item.amount;
                        });
                    }

                    async function getUserDevice() {
                        const getUserDevicex = await UserDeviceModel.findByID(userData.id);
                        cacheUserData.device = getUserDevicex;
                    }

                    await Promise.all([
                        getBank(),
                        getBetRefurn(),
                        getBetHistory(),
                        getIncentive(),
                        getIncentiveDonate(),
                        getUserDevice()
                    ]);

                    /***
                     * END Lấy thống kê người dùng hiện tại
                     */


                    /***
                     * Lấy thống kê người dùng và cấp dưới của đại lý hiện tại
                     */

                    const agencyData = await AgencyModel.findOne({ where: { uid: userData.id } });
                    const totalUsers = await AgencyRefModel.findAll({
                        where: { agency: agencyData.id },
                        include: [
                            {
                                model: UserModel.scope('withRoleUser'),
                                as: "userInfo",
                                attributes: ["id"],
                                require: false
                            }
                        ]
                    });

                    let listUserRefMe = [];
                    totalUsers.forEach((refUser) => listUserRefMe.push(refUser.userInfo.id));

                    let listUserRef = [];
                    listUserRef.push(userData.id); // chứa id của đại lý gốc và id của thành viên đại lý gốc
                    listUserRef = [...listUserRef, ...listUserRefMe, ...await getCurrentAgencyList(agencyData.id)]; // lấy danh sách uid ref dưới đại lý tính cả player và agency

                    /****
                     * listUserRef ban đầu đã chứa id của chính đại lý đang tham chiếu
                     * listUserRef được push thêm listUserRefMe = danh sách id người chơi của chính đại lý đang tham chiếu
                     * listUserRef cuối cùng được push thêm getCurrentAgencyList() = danh sách id đại lý cấp dưới và id người chơi của chính đại lý đang tham chiếu
                     */

                    let taskPromise = [];

                    await Promise.allSettled(listUserRef.map(async (userId) => {
                        return new Promise(async (resolve, reject) => {
                            taskPromise.push(
                                await UserModel.findOne({
                                    where: { id: userId },
                                    attributes: { exclude: ["password", "deletedAt", "code", "updatedAt"] }
                                })
                            )
                            resolve(userId);
                        });
                    }));

                    const getListUserDownline = await Promise.allSettled(taskPromise);

                    const listUserDownline = getListUserDownline
                        .filter(userPromise => userPromise.status === "fulfilled")
                        .map(userPromise => userPromise.value);

                    let TAG_ENUM = {
                        ROOT_AGENCY: "root_agency",
                        ROOT_AGENCY_USER: "root_agency_user",
                        CHILDREN_AGENCY: "children_agency",
                        CHILDREN_AGENCY_USER: "children_agency_user"
                    };

                    let exportData = [];

                    await Promise.allSettled(
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

                                if (itemObj.userInfo.id == userData.id) { // nếu người dùng chính là agency đang tham chiếu
                                    itemObj.tag = TAG_ENUM.ROOT_AGENCY;
                                } else { // nếu người dùng không phải là agency đang tham chiếu
                                    if (itemObj.uplineAgency.length == 0) {
                                        itemObj.tag = (itemObj.parentAgency.id == userData.id) ? TAG_ENUM.ROOT_AGENCY_USER : TAG_ENUM.CHILDREN_AGENCY_USER;
                                    } else {
                                        if (itemObj.uplineAgency.length > 1) {
                                            itemObj.tag = TAG_ENUM.CHILDREN_AGENCY;
                                        }
                                    }
                                }


                                let match = {};
                                match.uid = userRef.id;
                                match.createdAt = { [Op.between]: [timeStart.format(), timeEnd.format()] }

                                async function getBetRecord() {
                                    const getBetRecordx = await BetHistoryModel.findAll({
                                        where: match,
                                        attributes: {
                                            exclude: ['uid', 'username', 'updatedAt', 'deletedAt']
                                        },
                                        order: [["id", "DESC"]],
                                    });
                                    itemObj.betRecord = getBetRecordx;
                                }

                                async function getFinanRecord() {
                                    const getFinanRecordx = await BankHistoryModel.findAll({
                                        where: {
                                            ...match,
                                            status: BankHistoryModel.STATUS_ENUM.SUCCESS
                                        },
                                        attributes: ['type', 'amount', 'is_first', 'status', 'createdAt'],
                                        order: [["id", "DESC"]],
                                    });
                                    itemObj.finanRecord = getFinanRecordx;
                                }

                                async function getBetRefurn() {
                                    const getBetRefurnx = await BetRefurnModel.findAll({
                                        where: {
                                            uid: userRef.id,
                                            createdAt: match.createdAt
                                        }
                                    });
                                    itemObj.betRefurnRecord = getBetRefurnx;
                                }

                                async function getIncentive() {
                                    const getIncentivex = await UserIncentiveModel.findAll({
                                        where: {
                                            uid: userRef.id,
                                            createdAt: match.createdAt
                                        },
                                    });
                                    itemObj.incentiveRecord = getIncentivex;
                                }

                                async function getIncentiveDonate() {
                                    const getIncentiveDonatex = await UserIncentiveDonateModel.findAll({
                                        where: { uid: userRef.id },
                                        createdAt: match.createdAt
                                    });
                                    itemObj.incentiveDonateRecord = getIncentiveDonatex;
                                }

                                await Promise.all([
                                    getBetRecord(),
                                    getFinanRecord(),
                                    getBetRefurn(),
                                    getIncentive(),
                                    getIncentiveDonate()
                                ]);

                                exportData.push(itemObj);

                                resolve(true);
                            });
                        })
                    );
                    // cacheUserData.ProfitData = exportData;

                    let profitData = {
                        totalBalance: 0,
                        totalDeposit: 0,
                        totalWithdraw: 0,
                        totalDepositCount: 0,
                        totalWithdrawCount: 0,
                        totalBet: 0,
                        totalValidBet: 0,
                        totalNetPnl: 0,
                        totalWin: 0,
                        totalLose: 0,
                        totalWinLose: 0,
                        totalRefurn: 0,
                        totalIncentive: 0,
                        totalIncentiveDonate: 0,
                        totalRootAgentUser: 0,
                        totalChildAgent: 0,
                        totalChildAgentUser: 0,
                        totalNewRefUser: 0,
                        totalNewFirstDeposit: 0
                    };

                    exportData.map((user) => {

                        // caculator user totalBalance
                        profitData.totalBalance += user.userInfo.coin;

                        // caculator volume
                        user.betRecord.map((bet) => {
                            profitData.totalBet += Number(bet.betAmount) * 1000;
                            profitData.totalValidBet += Number(bet.validBetAmount) * 1000;
                            profitData.totalNetPnl += Number(bet.netPnl) * 1000;
                            (Number(bet.netPnl) > 0) ? profitData.totalWin += Number(bet.netPnl) * 1000 : profitData.totalLose += Number(bet.netPnl) * 1000;
                        });

                        // caculator user refurn
                        user.betRefurnRecord.map((refurn) => {
                            profitData.totalRefurn += Number(refurn.amountReturn);
                        });
                        // caculator user incentive
                        user.incentiveRecord.map((incentive) => {
                            profitData.totalIncentive += Number(incentive.amount);
                        });
                        // caculator user incentive donate
                        user.incentiveDonateRecord.map((incentive) => {
                            profitData.totalIncentiveDonate += Number(incentive.amount);
                        });
                        // caculator deposit
                        user.finanRecord.map((finan) => {
                            // console.log(deposit.uid, deposit.id, deposit.amount);
                            if (finan.type == BankHistoryModel.TYPE_ENUM.RECHARGE) {
                                if (finan.is_first) profitData.totalNewFirstDeposit++;
                                profitData.totalDepositCount++;
                                profitData.totalDeposit += Number(finan.amount);
                            }
                            if (finan.type == BankHistoryModel.TYPE_ENUM.CASHOUT) {
                                profitData.totalWithdrawCount++;
                                profitData.totalWithdraw += Number(finan.amount);
                            }
                        });

                        if (user.tag == TAG_ENUM.ROOT_AGENCY) { };
                        if (user.tag == TAG_ENUM.ROOT_AGENCY_USER) profitData.totalRootAgentUser++;
                        if (user.tag == TAG_ENUM.CHILDREN_AGENCY) profitData.totalChildAgent++;
                        if (user.tag == TAG_ENUM.CHILDREN_AGENCY_USER) profitData.totalChildAgentUser++;
                        
                        const userReg = moment.utc(user.userInfo.createdAt, "YYYY-MM-DDTHH:mm").local().format("DDMMYYYY");
                        if (Number(userReg) >= Number(dateCheckFrom) && Number(userReg) <= Number(dateCheckTo)) {
                            if (user.tag != TAG_ENUM.ROOT_AGENCY) profitData.totalNewRefUser++;
                        };

                    });

                    profitData.totalWinLose = profitData.totalDeposit + profitData.totalIncentiveDonate + profitData.totalRefurn - profitData.totalBalance - profitData.totalWithdraw;

                    cacheUserData.ProfitCalc = profitData;
                    // console.log(cacheUserData.ProfitCalc);

                    /***
                     * End Lấy thống kê người dùng và cấp dưới của đại lý hiện tại
                     */

                    dataExport.push(cacheUserData);
                }));

                return res.status(200).json({
                    status: true,
                    data: {
                        dataExport,
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
                        model: UserDeviceModel,
                        as: "user_device",
                        attributes: { exclude: ["deletedAt"] }
                    },
                    {
                        model: BankUserModel,
                        as: "BankUser",
                        attributes: { exclude: ["deletedAt"] },
                        required: false
                    },
                    {
                        model: WithdrawConditionModel,
                        as: "WithdrawConditionInfo"
                    }
                ]
            });

            if (!!user) {
                let dataExport = user.toJSON();
                dataExport.totalDeposit = 0;
                dataExport.totalWithdraw = 0;

                const getBankHistory = await BankHistoryModel.findAll({
                    where: {
                        uid: user.id,
                        status: BankHistoryModel.STATUS_ENUM.SUCCESS
                    },
                    attributes: ["type", "amount"]
                });

                getBankHistory.forEach((item) => {
                    if (item.type == BankHistoryModel.TYPE_ENUM.RECHARGE) dataExport.totalDeposit += item.amount;
                    if (item.type == BankHistoryModel.TYPE_ENUM.CASHOUT) dataExport.totalWithdraw += item.amount;
                });

                dataExport.agency = null;
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
                        dataExport.agency = getRefAgencyInfo.code;
                    }
                }

                return res.status(200).json({
                    status: true,
                    data: dataExport,
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
    // tính lợi nhuận của riêng agency, agency này chơi như nào ko tính cấp dưới
    AgencyProfit: async (req, res) => {
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
                where: { id, role: UserModel.ROLE_ENUM.AGENCY },
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
    // tính doanh số agency (các đại lý bên dưới và người chơi của cấp dưới)
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
                        attributes: { exclude: ["password", "deletedAt", "code", "role", "updatedAt"] },
                    }
                ]
            });
            const totalUsers = await AgencyRefModel.findAll({
                where: { agency: agencyData.id },
                include: [
                    {
                        model: UserModel.scope('withRoleUser'),
                        as: "userInfo",
                        attributes: { exclude: ["password", "deletedAt", "code", "updatedAt"] },
                        require: false
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

                    attributes: { exclude: ["password", "deletedAt", "code", "updatedAt"] }
                }));
            const getListUserDownline = await Promise.allSettled(taskPromise);

            let listUserDownline = [];
            for (const userPromise of getListUserDownline) {
                if (userPromise.status == "fulfilled") listUserDownline.push(userPromise.value);
            }

            if (agencyData.userInfo.id == 643)  console.log(listUserDownline.map((user) => user.id))

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

            // console.log(exportData);

            res.status(200).json({
                status: true,
                agency: agencyData,
                totalUsers,
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
    getBelowTreeArrayByAgency: async (req, res) => {
        try {
            const rootID = req.params.id; // uid agency user
            const getDataRootAgency = await AgencyModel.findOne({
                where: { uid: rootID }
            });

            if (!getDataRootAgency) {
                return res.json({
                    status: false,
                    msg: "Agency Not Found!"
                });
            }

            const getRootAgencyUserInfo = await UserModel.findOne({
                where: {
                    id: getDataRootAgency.id
                }
            });

            const listUserAndAgency = await getUserAndAgencyList(getDataRootAgency.id, true);

            let arrayDataTree = [{
                id: getDataRootAgency.id,
                parentId: 0,
                description: getRootAgencyUserInfo.username,
                userInfo: getRootAgencyUserInfo,
                children: null,
            }];

            for (const dataRef of listUserAndAgency) {
                const userInfo = await UserModel.findOne({
                    where: { id: (typeof dataRef == 'object') ? dataRef.id : dataRef }
                });

                let objectDataRef = {};

                if (!!userInfo) {
                    objectDataRef.id = userInfo.id; // gán id riêng biệt từ id user

                    const getRefByAgency = await AgencyRefModel.findOne({
                        where: {
                            uid: userInfo.id
                        }
                    });
                    const getAgencyData = await AgencyModel.findOne({
                        where: {
                            id: getRefByAgency.agency
                        }
                    });
                    const getAgencyUserInfo = await UserModel.findOne({
                        where: {
                            id: getAgencyData.uid
                        }
                    });

                    objectDataRef.parentId = getAgencyUserInfo.id; // user này được ref bởi agecy nào

                    let bonusText = (userInfo.role == UserModel.ROLE_ENUM.AGENCY) ? "Agency" : "Player";

                    objectDataRef.description = `${userInfo.username} (${bonusText})`; // gán text username
                    objectDataRef.tooltip = `Số dư: ${Helper.numberWithCommas(userInfo.coin)}`;
                    objectDataRef.userInfo = userInfo; // gán info user
                    objectDataRef.children = null; // gán children node

                    arrayDataTree.push(objectDataRef);
                }

                //console.log(objectDataRef)
            }

            const treeObject = listToTree(arrayDataTree, {
                idKey: 'id',
                parentKey: 'parentId',
                childrenKey: 'children'
            });

            return res.json(treeObject);

        } catch (e) {
            console.log(e);
            return res.json({
                status: false,
                msg: e.message
            });
        }
    },
    getCurrentTreeArrayByAgency: async (req, res) => {
        try {
            const rootID = req.params.id;

            const getDataRootAgency = await AgencyModel.findOne({
                where: { uid: rootID }
            });

            if (!getDataRootAgency) {
                return res.json({
                    status: false,
                    msg: "Agency Not Found!"
                });
            }

            const getRootAgencyUserInfo = await UserModel.findOne({
                where: {
                    id: getDataRootAgency.id
                }
            });


            const listUserAndAgency = await getCurrentTreeArrayByAgency(getRootAgencyUserInfo.id);

            let arrayDataTree = [];

            for (const dataRef of listUserAndAgency) {
                const userInfo = await UserModel.findOne({
                    where: { id: dataRef.uid }
                });

                let objectDataRef = {};

                if (!!userInfo) {
                    objectDataRef.id = userInfo.id; // gán id riêng biệt từ id user

                    objectDataRef.parentId = dataRef.parentID; // user này được ref bởi agecy nào

                    let bonusText = (dataRef.role == UserModel.ROLE_ENUM.AGENCY) ? "Agency" : "Player";

                    objectDataRef.description = `${dataRef.username} (${bonusText})`; // gán text username
                    objectDataRef.tooltip = `Số dư: ${Helper.numberWithCommas(userInfo.coin)}`;
                    objectDataRef.userInfo = userInfo; // gán info user
                    objectDataRef.children = null; // gán children node

                    arrayDataTree.push(objectDataRef);
                }

                //console.log(objectDataRef)
            }

            const treeObject = listToTree(arrayDataTree, {
                idKey: 'id',
                parentKey: 'parentId',
                childrenKey: 'children'
            });

            return res.json(treeObject);


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

                const { agency, name, username, code, email, phone, coin, status, verify, role } = req.body;

                const user = await findByID(id);
                const agencyCode = agency;
                if (!!user) {
                    if (agencyCode) {
                        console.log(agencyCode);
                        // check agency exit
                        const getAgencyInfo = await AgencyModel.findOne({
                            where: {
                                code: agencyCode
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

                    // user.isPlay = UserModel.IS_PLAY_ENUM.FALSE;
                    user.name = name.toUpperCase();
                    user.username = username.toLowerCase();
                    user.email = email.toLowerCase();
                    user.phone = phone;
                    user.coin = coin;
                    user.status = status;
                    user.verify = verify;
                    if (role == UserModel.ROLE_ENUM.USER || role == UserModel.ROLE_ENUM.AGENCY) user.role = role;

                    await user.save();
                    await user.reload();

                    const agency = await AgencyModel.findOne({ where: { uid: user.id } });

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
        }
    }
};
