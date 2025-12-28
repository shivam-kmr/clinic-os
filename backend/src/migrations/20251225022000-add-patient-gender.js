'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('patients', 'gender', {
      type: Sequelize.ENUM('MALE', 'FEMALE', 'OTHER', 'UNKNOWN'),
      allowNull: false,
      defaultValue: 'UNKNOWN',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('patients', 'gender');
    await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "enum_patients_gender";`);
  },
};



