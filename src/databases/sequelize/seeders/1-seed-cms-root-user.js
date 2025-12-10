'use strict';

const md5 = require("md5");
const tableName = "admin_accounts";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    return await queryInterface.bulkInsert(
      tableName, // table name
      [
        {
          name: "Super Admin",
          username: "root",
          position: "Quản trị tổng",
          email: "root@website.com",
          phone: "+84999999999",
          password: md5("123123123"),
          avatar: 0,
          role: "root",
          status: "active",
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: "Administrator",
          username: "admin",
          position: "Quản trị tổng",
          email: "root@website.com",
          phone: "+84999999999",
          password: md5("123123123"),
          avatar: 0,
          role: "custom",
          status: "active",
          createdAt: new Date(),
          updatedAt: new Date()
        },
      ], {
      // options for bulkInsert
    });
  },

  async down (queryInterface, Sequelize) {
    return await queryInterface.bulkDelete(tableName, null, {});
  }
};
