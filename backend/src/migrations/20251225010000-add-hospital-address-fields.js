'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('hospitals', 'street', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('hospitals', 'buildingNumber', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('hospitals', 'city', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('hospitals', 'state', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('hospitals', 'postalCode', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('hospitals', 'country', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('hospitals', 'country');
    await queryInterface.removeColumn('hospitals', 'postalCode');
    await queryInterface.removeColumn('hospitals', 'state');
    await queryInterface.removeColumn('hospitals', 'city');
    await queryInterface.removeColumn('hospitals', 'buildingNumber');
    await queryInterface.removeColumn('hospitals', 'street');
  },
};



