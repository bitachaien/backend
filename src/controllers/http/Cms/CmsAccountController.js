const { Op } = require("sequelize");
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
const validator = require("validator");
const { validateEmail } = require("@Helpers/email");
const Helper = require("@Helpers/helpers");
const { parseInt } = require("@Helpers/Number");
const SysPerms = require("@Configs/admin/permission.json");
const { generatePassword, validatePassword, randomPassword } = require("@Helpers/password");
const { AdminAccountModel, findByUsername, findByEmail, findByID } = require("@Models/Admin/AdminAccount");
const { AdminPermModel } = require("@Models/Admin/AdminPermission");
const { AdminPasswdSecurityModel } = require("@Models/Admin/AdminPasswdSecurity");

module.exports = {
    systemPerms: async (req, res) => {
        return res.status(200).json({
            status: true,
            data: SysPerms,
            msg: SUCCESS
        });
    },
    listAccount: async (req, res) => {
        try {
            const page = parseInt(req.query.page, true)
                ? parseInt(req.query.page, true)
                : 0;
            const kmess = parseInt(req.query.limit, true)
                ? parseInt(req.query.limit, true)
                : 0;

            if (!page && !kmess) return res.status(200).json({
                status: false,
                msg: ERROR_FORM.MISSING_FIELD
            });

            let match = {};
            match.role = AdminAccountModel.ROLE_ENUM.CUSTOM;

            const total = await AdminAccountModel.count({ where: match, distinct: false });
            const getUsers = await AdminAccountModel.findAll({
                where: match,
                offset: 0 + (page - 1) * kmess,
                limit: kmess,
                order: [["id", "DESC"]],
                attributes: { exclude: ["password", "deletedAt", "role"] },
                include: [
                    {
                        model: AdminPermModel,
                        as: "account_permission"
                    }
                ]
            });

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
        } catch (e) {
            console.log(e);
            res.status(200).json({
                status: false,
                msg: e.message,
                code: 500
            });
        }
    },
    getAccountInfo: async (req, res) => {
        try {
            const { id } = req.params;

            if (!id) return res.status(200).json({
                status: false,
                msg: ERROR_FORM.MISSING_FIELD
            });

            const user = await AdminAccountModel.findByPk(id, {
                attributes: { exclude: ["password", "deletedAt", "role"] },
                include: [
                    {
                        model: AdminPermModel,
                        as: "account_permission"
                    }
                ]
            });

            if (!user) return res.status(200).json({
                status: false,
                msg: ERROR_AUTH_MESSAGE.UserNotFound
            });

            return res.status(200).json({
                status: true,
                data: user,
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
        Create: async (req, res) => {
            try {
                const user = req.body;

                if (
                    user.name == null ||
                    user.username == null ||
                    user.email == null ||
                    user.phone == null ||
                    user.password == null ||
                    user.position == null ||
                    user.name == "" ||
                    user.username == "" ||
                    user.email == "" ||
                    user.phone == "" ||
                    user.password == "" ||
                    user.position == ""
                )
                    return res.status(200).json({
                        status: false,
                        msg: ERROR_FORM.MISSING_FIELD
                    });

                if (
                    user.name.match(
                        /^([a-zA-Z]{2,}\s[a-zA-Z]{1,}'?-?[a-zA-Z]{2,}\s?([a-zA-Z]{1,})?)/
                    ) == null
                )
                    return res.status(200).json({
                        status: false,
                        msg: ERROR_AUTH_MESSAGE.InvalidName
                    });
                if (!validator.isLength(user.name, { min: 8, max: 100 }))
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


                // đăng kí tài khoản
                user.name = user.name.toUpperCase();
                user.username = user.username.toLowerCase();
                user.phone = user.phone;
                user.email = user.email.toLowerCase();
                user.status = AdminAccountModel.STATUS_ENUM.ACTIVE;
                user.role = AdminAccountModel.ROLE_ENUM.CUSTOM;
                user.position = user.position;
                const passwordHash = generatePassword(user.password);
                user.password = passwordHash;
                const userSaved = await AdminAccountModel.create(user);
                await userSaved.reload();
                const userJSON = userSaved.toJSON();
                delete userJSON.code;
                delete userJSON.password;
                delete userJSON.deletedAt;

                const getUserSecrPasswd = await AdminPasswdSecurityModel.findPasswdByUserId(userSaved.id);
                if (!getUserSecrPasswd) AdminPasswdSecurityModel.create({
                    uid: userSaved.id,
                    password: "12345" // default password
                });

                return res.status(200).json({
                    status: true,
                    msg: SUCCESS,
                    user: userJSON
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
        Update: async (req, res) => {
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

                const { name, username, email, phone, status } = req.body;

                const user = await findByID(id);
                if (!user) return res.status(200).json({
                    status: false,
                    msg: "User not found!",
                    code: 400
                });

                user.name = name.toUpperCase();
                user.username = username.toLowerCase();
                user.email = email.toLowerCase();
                user.phone = phone;
                user.status = status;
                await user.save();
                await user.reload();

                res.status(200).json({
                    status: true,
                    msg: "Cập nhật thành công!",
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
        UpdatePerm: async (req, res) => {
            try {
                const { id } = req.params;
                const { permission, allow } = req.body;

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

                if (!permission) {
                    return res.status(200).json({
                        status: false,
                        msg: "Missing Param Permission"
                    });
                }

                const user = await AdminAccountModel.findByPk(id);

                if (!user) {
                    return res.status(200).json({
                        status: false,
                        msg: "User not found!"
                    });
                }

                const accountPermission = await AdminPermModel.findOne({
                    where: { uid: id, position: permission }
                });

                if (!accountPermission) {
                    await AdminPermModel.create({
                        uid: id,
                        position: permission,
                        allow
                    });
                } else {
                    accountPermission.allow = allow;
                    await accountPermission.save();
                    await accountPermission.reload();
                }

                return res.status(200).json({
                    status: true,
                    msg: "Success"
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
        Delete: async (req, res) => {
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

                const promotion = await AdminAccountModel.findOne({ where: { id } });

                if (!!promotion) {
                    const deletePermission = await AdminPermModel.destroy({
                        where: { uid: promotion.id },
                        force: true
                    });

                    const deletePwd2 = await AdminPasswdSecurityModel.destroy({
                        where: { uid: promotion.id },
                        force: true
                    });

                    const deletePromotion = await AdminAccountModel.destroy({
                        where: { id: promotion.id },
                        force: true
                    });

                    if (!!deletePromotion) {
                        return res.status(200).json({
                            status: true,
                            data: null,
                            msg: "Success"
                        });
                    } else {
                        return res.status(200).json({
                            status: false,
                            msg: "Err Delete Account"
                        });
                    }
                } else {
                    return res.status(200).json({
                        status: false,
                        msg: "Account not found!"
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
        },
    }
};
