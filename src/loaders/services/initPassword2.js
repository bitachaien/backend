
const { UserModel } = require("@Models/User/User");
const { PasswdSecurityModel } = require("@Models/Security/PasswdSecurity");
const { generatePassword, validatePassword } = require("@Helpers/password");

module.exports = async function () {
    const getUsers = await UserModel.findAll();
    for (const user of getUsers) {
        const checkPass2 = await PasswdSecurityModel.findOne({ where: { uid: user.id } });
        if (!checkPass2) {
            PasswdSecurityModel.create({
                uid: user.id,
                password: "12345"
            });
        }
    }
};