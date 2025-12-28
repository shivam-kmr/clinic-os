'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add subdomain and customDomain fields to hospitals table
    await queryInterface.addColumn('hospitals', 'subdomain', {
      type: Sequelize.STRING,
      allowNull: true,
      unique: true,
    });

    await queryInterface.addColumn('hospitals', 'customDomain', {
      type: Sequelize.STRING,
      allowNull: true,
      unique: true,
    });

    await queryInterface.addColumn('hospitals', 'customDomainVerified', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });

    // Add indexes
    await queryInterface.addIndex('hospitals', ['subdomain'], {
      unique: true,
      name: 'hospitals_subdomain_unique',
    });

    await queryInterface.addIndex('hospitals', ['customDomain'], {
      unique: true,
      name: 'hospitals_customDomain_unique',
    });

    // Add HOSPITAL_MANAGER to user role enum
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_users_role" ADD VALUE IF NOT EXISTS 'HOSPITAL_MANAGER';
    `);

    // Create patient_users table
    await queryInterface.createTable('patient_users', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      passwordHash: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      firstName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      lastName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      phone: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    await queryInterface.addIndex('patient_users', ['email'], {
      unique: true,
      name: 'patient_users_email_unique',
    });

    // Create patient_hospitals junction table
    await queryInterface.createTable('patient_hospitals', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      patientUserId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'patient_users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      hospitalId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'hospitals',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      patientId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'patients',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    await queryInterface.addIndex('patient_hospitals', ['patientUserId', 'hospitalId'], {
      unique: true,
      name: 'patient_hospitals_patientUserId_hospitalId_unique',
    });

    await queryInterface.addIndex('patient_hospitals', ['hospitalId'], {
      name: 'patient_hospitals_hospitalId_idx',
    });

    await queryInterface.addIndex('patient_hospitals', ['patientId'], {
      name: 'patient_hospitals_patientId_idx',
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove indexes
    await queryInterface.removeIndex('hospitals', 'hospitals_subdomain_unique');
    await queryInterface.removeIndex('hospitals', 'hospitals_customDomain_unique');

    // Remove columns
    await queryInterface.removeColumn('hospitals', 'subdomain');
    await queryInterface.removeColumn('hospitals', 'customDomain');
    await queryInterface.removeColumn('hospitals', 'customDomainVerified');

    // Drop patient_hospitals table
    await queryInterface.dropTable('patient_hospitals');

    // Drop patient_users table
    await queryInterface.dropTable('patient_users');

    // Note: Cannot remove enum value in PostgreSQL, so HOSPITAL_MANAGER will remain
  },
};



