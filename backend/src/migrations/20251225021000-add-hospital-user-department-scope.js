'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('hospital_users', 'departmentId', {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'departments', key: 'id' },
      onDelete: 'SET NULL',
    });

    await queryInterface.addIndex('hospital_users', ['departmentId'], {
      name: 'hospital_users_departmentId_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('hospital_users', 'hospital_users_departmentId_idx');
    await queryInterface.removeColumn('hospital_users', 'departmentId');
  },
};



