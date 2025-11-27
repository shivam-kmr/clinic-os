'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Create Hospitals table
    await queryInterface.createTable('hospitals', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      address: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      phone: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('ACTIVE', 'SUSPENDED'),
        defaultValue: 'ACTIVE',
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

    // Create Users table
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      hospitalId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'hospitals',
          key: 'id',
        },
        onDelete: 'SET NULL',
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
      role: {
        type: Sequelize.ENUM('SUPERADMIN', 'HOSPITAL_OWNER', 'RECEPTIONIST', 'DOCTOR'),
        allowNull: false,
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

    // Create Departments table
    await queryInterface.createTable('departments', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
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
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
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

    // Create Doctors table
    await queryInterface.createTable('doctors', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
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
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      departmentId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'departments',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      employeeId: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      specialization: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('ACTIVE', 'ON_LEAVE', 'INACTIVE'),
        defaultValue: 'ACTIVE',
      },
      consultationDuration: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      dailyPatientLimit: {
        type: Sequelize.INTEGER,
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

    // Create Patients table
    await queryInterface.createTable('patients', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
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
      phone: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      firstName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      lastName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      dateOfBirth: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      address: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      emergencyContact: {
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

    // Create HospitalConfigs table
    await queryInterface.createTable('hospital_configs', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      hospitalId: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
        references: {
          model: 'hospitals',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      bookingMode: {
        type: Sequelize.ENUM('TOKEN_ONLY', 'TIME_SLOT_ONLY', 'BOTH'),
        defaultValue: 'TOKEN_ONLY',
      },
      defaultConsultationDuration: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 15,
      },
      bufferTimeBetweenAppointments: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 5,
      },
      arrivalWindowBeforeAppointment: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 15,
      },
      businessHours: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {
          monday: { start: '10:00', end: '18:00', isOpen: true },
          tuesday: { start: '10:00', end: '18:00', isOpen: true },
          wednesday: { start: '10:00', end: '18:00', isOpen: true },
          thursday: { start: '10:00', end: '18:00', isOpen: true },
          friday: { start: '10:00', end: '18:00', isOpen: true },
          saturday: { start: '10:00', end: '18:00', isOpen: true },
          sunday: { start: '10:00', end: '18:00', isOpen: false },
        },
      },
      tokenResetFrequency: {
        type: Sequelize.ENUM('DAILY', 'WEEKLY', 'MONTHLY', 'NEVER'),
        defaultValue: 'DAILY',
      },
      autoReassignOnLeave: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      maxQueueLength: {
        type: Sequelize.INTEGER,
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

    // Create Appointments table
    await queryInterface.createTable('appointments', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
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
      departmentId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'departments',
          key: 'id',
        },
        onDelete: 'SET NULL',
      },
      doctorId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'doctors',
          key: 'id',
        },
        onDelete: 'SET NULL',
      },
      scheduledAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('PENDING', 'CONFIRMED', 'CANCELLED', 'NO_SHOW', 'COMPLETED'),
        defaultValue: 'PENDING',
      },
      bookingType: {
        type: Sequelize.ENUM('ONLINE', 'WALK_IN'),
        allowNull: false,
      },
      notes: {
        type: Sequelize.TEXT,
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

    // Create Visits table
    await queryInterface.createTable('visits', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
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
      appointmentId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'appointments',
          key: 'id',
        },
        onDelete: 'SET NULL',
      },
      doctorId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'doctors',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      departmentId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'departments',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      tokenNumber: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM(
          'WAITING',
          'CHECKED_IN',
          'IN_PROGRESS',
          'ON_HOLD',
          'COMPLETED',
          'CANCELLED',
          'NO_SHOW',
          'SKIPPED',
          'CARRYOVER'
        ),
        defaultValue: 'WAITING',
      },
      priority: {
        type: Sequelize.ENUM('NORMAL', 'VIP', 'URGENT'),
        defaultValue: 'NORMAL',
      },
      checkedInAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      startedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      completedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      estimatedWaitTime: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      isCarryover: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
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

    // Create VisitHistory table
    await queryInterface.createTable('visit_history', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      visitId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'visits',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      hospitalId: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      patientId: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      doctorId: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      departmentId: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      tokenNumber: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      status: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      priority: {
        type: Sequelize.ENUM('NORMAL', 'VIP', 'URGENT'),
        allowNull: false,
      },
      checkedInAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      startedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      completedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      actualWaitTime: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      actualConsultationDuration: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    // Create indexes
    await queryInterface.addIndex('users', ['hospitalId']);
    await queryInterface.addIndex('users', ['email'], { unique: true });
    await queryInterface.addIndex('departments', ['hospitalId']);
    await queryInterface.addIndex('doctors', ['hospitalId']);
    await queryInterface.addIndex('doctors', ['userId'], { unique: true });
    await queryInterface.addIndex('doctors', ['departmentId']);
    await queryInterface.addIndex('patients', ['hospitalId']);
    await queryInterface.addIndex('patients', ['hospitalId', 'phone']);
    await queryInterface.addIndex('patients', ['hospitalId', 'email']);
    await queryInterface.addIndex('appointments', ['hospitalId']);
    await queryInterface.addIndex('appointments', ['patientId']);
    await queryInterface.addIndex('appointments', ['doctorId']);
    await queryInterface.addIndex('appointments', ['departmentId']);
    await queryInterface.addIndex('appointments', ['doctorId', 'scheduledAt']);
    await queryInterface.addIndex('appointments', ['scheduledAt']);
    await queryInterface.addIndex('visits', ['hospitalId']);
    await queryInterface.addIndex('visits', ['doctorId', 'status']);
    await queryInterface.addIndex('visits', ['departmentId', 'status']);
    await queryInterface.addIndex('visits', ['patientId']);
    await queryInterface.addIndex('visits', ['appointmentId']);
    await queryInterface.addIndex('visits', ['status']);
    await queryInterface.addIndex('visits', ['checkedInAt']);
    await queryInterface.addIndex('visit_history', ['visitId']);
    await queryInterface.addIndex('visit_history', ['hospitalId']);
    await queryInterface.addIndex('visit_history', ['doctorId']);
    await queryInterface.addIndex('visit_history', ['departmentId']);
    await queryInterface.addIndex('visit_history', ['completedAt']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('visit_history');
    await queryInterface.dropTable('visits');
    await queryInterface.dropTable('appointments');
    await queryInterface.dropTable('hospital_configs');
    await queryInterface.dropTable('patients');
    await queryInterface.dropTable('doctors');
    await queryInterface.dropTable('departments');
    await queryInterface.dropTable('users');
    await queryInterface.dropTable('hospitals');
  },
};

