'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Ensure we can generate UUIDs in raw SQL backfills
    await queryInterface.sequelize.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);

    // 1) Create hospital_users membership table (idempotent)
    const tables = await queryInterface.showAllTables();
    const hasHospitalUsersTable = tables
      .map((t) => (typeof t === 'string' ? t : t.tableName))
      .includes('hospital_users');

    if (!hasHospitalUsersTable) {
      await queryInterface.createTable('hospital_users', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      hospitalId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'hospitals', key: 'id' },
        onDelete: 'CASCADE',
      },
      role: {
        type: Sequelize.ENUM('HOSPITAL_OWNER', 'HOSPITAL_MANAGER', 'RECEPTIONIST', 'DOCTOR'),
        allowNull: false,
      },
      doctorId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'doctors', key: 'id' },
        onDelete: 'SET NULL',
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

    // Add indexes only if they don't already exist
    const existingIndexes = await queryInterface.showIndex('hospital_users').catch(() => []);
    const hasIndex = (name) => existingIndexes.some((i) => i.name === name);

    if (!hasIndex('hospital_users_userId_hospitalId_unique')) {
      await queryInterface.addIndex('hospital_users', ['userId', 'hospitalId'], {
        unique: true,
        name: 'hospital_users_userId_hospitalId_unique',
      });
    }
    if (!hasIndex('hospital_users_hospitalId_idx')) {
      await queryInterface.addIndex('hospital_users', ['hospitalId'], {
        name: 'hospital_users_hospitalId_idx',
      });
    }
    if (!hasIndex('hospital_users_userId_idx')) {
      await queryInterface.addIndex('hospital_users', ['userId'], {
        name: 'hospital_users_userId_idx',
      });
    }

    // 2) Allow multiple doctor profiles per user (one per hospital)
    // Drop previous unique constraint/index on doctors.userId if it exists
    await queryInterface.sequelize.query(`
      ALTER TABLE "doctors" DROP CONSTRAINT IF EXISTS "doctors_userId_key";
    `);
    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS "doctors_userId";
    `);
    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS "doctors_userid";
    `);
    await queryInterface.removeIndex('doctors', ['userId']).catch(() => {});

    // Add composite unique index only if it doesn't already exist
    const existingDoctorIndexes = await queryInterface.showIndex('doctors').catch(() => []);
    const hasDoctorIndex = (name) => existingDoctorIndexes.some((i) => i.name === name);
    if (!hasDoctorIndex('doctors_userId_hospitalId_unique')) {
      await queryInterface.addIndex('doctors', ['userId', 'hospitalId'], {
        unique: true,
        name: 'doctors_userId_hospitalId_unique',
      });
    }

    // 3) Backfill membership rows for existing users that have users.hospitalId set
    // Also backfill doctorId by joining doctors (if a matching doctor exists for that hospital)
    await queryInterface.sequelize.query(`
      INSERT INTO "hospital_users" ("id", "userId", "hospitalId", "role", "doctorId", "createdAt", "updatedAt")
      SELECT
        gen_random_uuid(),
        u."id" AS "userId",
        u."hospitalId" AS "hospitalId",
        (CASE
          WHEN u."role" = 'SUPERADMIN' THEN 'HOSPITAL_OWNER'
          WHEN u."role" = 'HOSPITAL_OWNER' THEN 'HOSPITAL_OWNER'
          WHEN u."role" = 'HOSPITAL_MANAGER' THEN 'HOSPITAL_MANAGER'
          WHEN u."role" = 'RECEPTIONIST' THEN 'RECEPTIONIST'
          WHEN u."role" = 'DOCTOR' THEN 'DOCTOR'
          ELSE 'HOSPITAL_OWNER'
        END)::"enum_hospital_users_role" AS "role",
        d."id" AS "doctorId",
        NOW(),
        NOW()
      FROM "users" u
      LEFT JOIN "doctors" d
        ON d."userId" = u."id" AND d."hospitalId" = u."hospitalId"
      WHERE u."hospitalId" IS NOT NULL
      ON CONFLICT ("userId", "hospitalId") DO NOTHING;
    `);
  },

  async down(queryInterface, Sequelize) {
    // Remove composite index on doctors
    await queryInterface.removeIndex('doctors', 'doctors_userId_hospitalId_unique').catch(() => {});

    // Re-add the old unique constraint on doctors.userId (best effort)
    await queryInterface.addIndex('doctors', ['userId'], {
      unique: true,
      name: 'doctors_userId_unique_legacy',
    }).catch(() => {});

    // Drop hospital_users table
    await queryInterface.dropTable('hospital_users');

    // Drop enum type for hospital_users.role (Postgres)
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_hospital_users_role";
    `);
  },
};


