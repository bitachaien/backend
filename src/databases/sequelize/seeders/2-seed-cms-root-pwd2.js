'use strict';

const md5 = require("md5");
const tableName = "admin_password_securitys";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    return await queryInterface.bulkInsert(
      tableName, // table name
      [
        {
          uid: 1,
          password: md5("12345"),
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          uid: 2,
          password: md5("12345"),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ], {
      // options for bulkInsert
    });
  },

  async down (queryInterface, Sequelize) {
    return await queryInterface.bulkDelete(tableName, null, {});
  }
};
