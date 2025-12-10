const { UserModel } = require("@Models/User/User");
const { MiniTaixiuUserModel } = require("@Models/Game/MiniTaiXiu/User");

module.exports = async () => {
    const getUsersBot = await MiniTaixiuUserModel.findAll({
        where: {
            is_bot: MiniTaixiuUserModel.IS_BOT.TRUE
        }
    });

    for (const userBot of getUsersBot) {
        const user = await UserModel.findOne({
            where: { id: userBot.uid }
        });

        if (!!user) {
            user.is_bot = UserModel.IS_BOT.TRUE;
            await user.save();
            console.log("SET BOT USER: " + user.username + " - UID: " + user.id);
        }
    }
    console.log("=========SUCESSS==========")
};
