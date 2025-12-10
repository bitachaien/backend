const sequelize = require("@Databases/mysql");
const { Model, DataTypes } = require("sequelize");

class AdminAccountModel extends Model {
  static STATUS_ENUM = {
    ACTIVE: "active",
    PENDING: "pending",
    BLOCKED: "blocked"
  };
  static ROLE_ENUM = {
    ROOT: "root", // nếu là tài khoản root thì bỏ qua việc kiểm tra quyền
    CUSTOM: "custom" // custom là role cần kiểm tra các quyền được áp dụng
  };
  static scopes = {}
}

const defineParams = {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  username: { type: DataTypes.STRING, allowNull: false },
  position: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false },
  phone: { type: DataTypes.STRING, allowNull: false },
  password: { type: DataTypes.STRING, allowNull: false },
  avatar: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  role: { type: DataTypes.STRING, defaultValue: AdminAccountModel.ROLE_ENUM.CUSTOM },
  status: {
    type: DataTypes.ENUM({ values: Object.values(AdminAccountModel.STATUS_ENUM) }),
    defaultValue: AdminAccountModel.STATUS_ENUM.ACTIVE
  },
  createdAt: { type: DataTypes.DATE },
  updatedAt: { type: DataTypes.DATE },
  deletedAt: { type: DataTypes.DATE }
};


AdminAccountModel.init(defineParams, {
  paranoid: true,
  indexes: [{ unique: true, fields: ["username"] }],
  tableName: "admin_accounts",
  updatedAt: "updatedAt",
  createdAt: "createdAt",
  deletedAt: "deletedAt",
  scopes: AdminAccountModel.scopes,
  sequelize
});

const findByUsername = async (username) => {
  const user = await AdminAccountModel.findOne({ where: { username } });
  if (user == null) {
    return null;
  } else {
    return user;
  }
};

const findByEmail = async (email) => {
  const user = await AdminAccountModel.findOne({ where: { email } });
  if (user == null) {
    return null;
  } else {
    return user;
  }
};

const findByID = async (userId) => {
  const user = await AdminAccountModel.findOne({
    where: { 
      id: userId  // status: UserModel.STATUS_ENUM.ACTIVE
    }
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
  AdminAccountModel
};
