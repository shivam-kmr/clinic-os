'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Idempotent: allow safe re-runs even if the table/indexes were created
    const tables = await queryInterface.showAllTables();
    const hasDepartmentConfigsTable = tables
      .map((t) => (typeof t === 'string' ? t : t.tableName))
      .includes('department_configs');

    if (!hasDepartmentConfigsTable) {
      await queryInterface.createTable('department_configs', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      hospitalId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'hospitals', key: 'id' },
        onDelete: 'CASCADE',
      },
      departmentId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'departments', key: 'id' },
        onDelete: 'CASCADE',
      },
      bookingMode: {
        type: Sequelize.ENUM('TOKEN_ONLY', 'TIME_SLOT_ONLY', 'BOTH'),
        allowNull: true,
        defaultValue: null,
      },
      defaultConsultationDuration: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      bufferTimeBetweenAppointments: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      arrivalWindowBeforeAppointment: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      tokenResetFrequency: {
        type: Sequelize.ENUM('DAILY', 'WEEKLY', 'MONTHLY', 'NEVER'),
        allowNull: true,
      },
      maxQueueLength: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      tokenPrefix: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      });
    }

    const existingIndexes = await queryInterface.showIndex('department_configs').catch(() => []);
    const hasIndex = (name) => existingIndexes.some((i) => i.name === name);

    if (!hasIndex('department_configs_hospitalId_idx')) {
      await queryInterface.addIndex('department_configs', ['hospitalId'], {
        name: 'department_configs_hospitalId_idx',
      });
    }
    if (!hasIndex('department_configs_departmentId_unique')) {
      await queryInterface.addIndex('department_configs', ['departmentId'], {
        unique: true,
        name: 'department_configs_departmentId_unique',
      });
    }
    if (!hasIndex('department_configs_hospital_department_unique')) {
      await queryInterface.addIndex('department_configs', ['hospitalId', 'departmentId'], {
        unique: true,
        name: 'department_configs_hospital_department_unique',
      });
    }
  },

  async down(queryInterface) {
    await queryInterface.dropTable('department_configs');
    await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "enum_department_configs_bookingMode";`);
    await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "enum_department_configs_tokenResetFrequency";`);
  },
};


