const sequelize = require("@Databases/mysql");
const { Model, DataTypes } = require("sequelize");
const { AgencyModel } = require("@Models/Agency/Agency");
const { BankUserModel } = require("@Models/Bank/BankUser");

class UserModel extends Model {
  static IS_BOT = {
    TRUE: true,
    FALSE: false
  };
  static STATUS_ENUM = {
    ACTIVE: "active",
    PENDING: "pending",
    BLOCKED: "blocked"
  };
  static ROLE_ENUM = {
    ROOT: "root",
    ADMIN: "admin",
    USER: "user",
    AGENCY: "agency",
  };
  static VERIFY_ENUM = {
    TRUE: true,
    FALSE: false
  };

  static scopes = {
    withAgencyInfo() {
      return {
        include: [
          {
            model: AgencyModel,
            as: "AgencyInfo"
          }
        ]
      }
    },
    withRoleAgency() {
      return {
        where: { role: UserModel.ROLE_ENUM.AGENCY }
      }
    },
    withRoleUser() {
      return {
        where: { role: UserModel.ROLE_ENUM.USER }
      }
    },
    withBankUser() {
      return {
        include: [
          {
            model: BankUserModel,
            as: "BankUser",
            //attributes: { exclude: ["password", "deletedAt", "code", "role", "updatedAt"] },
          },
        ]
      }
    },
    byAgencyCode(code) {
      return {
        include: [
          {
            model: AgencyModel,
            as: "AgencyInfo",
            where: { code },
          }
        ]
      }
    },
  }
}

const defineParams = {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  username: { type: DataTypes.STRING, allowNull: false },
  is_bot: { type: DataTypes.BOOLEAN, defaultValue: UserModel.IS_BOT.FALSE, defaultValue: false },
  email: { type: DataTypes.STRING, allowNull: false },
  phone: { type: DataTypes.STRING, allowNull: false },
  password: { type: DataTypes.STRING, allowNull: false },
  avatar: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  role: { type: DataTypes.STRING, defaultValue: UserModel.ROLE_ENUM.USER },
  status: {
    type: DataTypes.ENUM({ values: Object.values(UserModel.STATUS_ENUM) }),
    defaultValue: UserModel.STATUS_ENUM.ACTIVE
  },
  coin: { type: DataTypes.DECIMAL(19, 2), defaultValue: 0 },
  verify: {
    type: DataTypes.BOOLEAN,
    defaultValue: UserModel.VERIFY_ENUM.FALSE
  },
  code: { type: DataTypes.STRING, allowNull: true },
  createdAt: { type: DataTypes.DATE },
  updatedAt: { type: DataTypes.DATE },
  deletedAt: { type: DataTypes.DATE }
};


UserModel.init(defineParams, {
  paranoid: true,
  indexes: [{ unique: true, fields: ["username"] }],
  tableName: "users",
  updatedAt: "updatedAt",
  createdAt: "createdAt",
  deletedAt: "deletedAt",
  scopes: UserModel.scopes,
  sequelize
});

const findByUsername = async (username) => {
  const user = await UserModel.findOne({
    where: { username }
  });
  if (user == null) {
    return null;
  } else {
    return user;
  }
};

const findByEmail = async (email) => {
  const user = await UserModel.findOne({
    where: { email }
  });
  if (user == null) {
    return null;
  } else {
    return user;
  }
};

const findByID = async (userId) => {
  const user = await UserModel.findOne({
    where: {
      id: userId
      // status: UserModel.STATUS_ENUM.ACTIVE
    }
  });
  if (user == null) {
    return null;
  } else {
    return user;
  }
};

const findByPhoneNumber = async (PhoneNumber) => {
  const user = await UserModel.findOne({
    where: { phone: PhoneNumber }
  });
  if (user == null) {
    return null;
  } else {
    return user;
  }
};


module.exports = {
  findByUsername,
  findByEmail,
  findByID,
  findByPhoneNumber,
  UserModel
};
