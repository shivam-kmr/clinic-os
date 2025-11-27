const bcrypt = require('bcryptjs');

module.exports = {
  async up(queryInterface) {
    // Check if hospital already exists
    const [existingHospitals] = await queryInterface.sequelize.query(
      "SELECT id FROM hospitals WHERE id = '00000000-0000-0000-0000-000000000001'"
    );

    if (existingHospitals.length === 0) {
      // Create a hospital
      await queryInterface.bulkInsert(
        'hospitals',
        [
          {
            id: '00000000-0000-0000-0000-000000000001',
            name: 'Demo Hospital',
            address: '123 Main Street, City',
            phone: '+1234567890',
            email: 'info@demohospital.com',
            status: 'ACTIVE',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        {}
      );
    }

    const hospitalId = '00000000-0000-0000-0000-000000000001';

    // Check if config already exists
    const [existingConfigs] = await queryInterface.sequelize.query(
      `SELECT id FROM hospital_configs WHERE "hospitalId" = '${hospitalId}'`
    );

    if (existingConfigs.length === 0) {
      // Create hospital config
      await queryInterface.bulkInsert('hospital_configs', [
      {
        id: '00000000-0000-0000-0000-000000000002',
        hospitalId,
        bookingMode: 'TOKEN_ONLY',
        defaultConsultationDuration: 15,
        bufferTimeBetweenAppointments: 5,
        arrivalWindowBeforeAppointment: 15,
        businessHours: JSON.stringify({
          monday: { start: '10:00', end: '18:00', isOpen: true },
          tuesday: { start: '10:00', end: '18:00', isOpen: true },
          wednesday: { start: '10:00', end: '18:00', isOpen: true },
          thursday: { start: '10:00', end: '18:00', isOpen: true },
          friday: { start: '10:00', end: '18:00', isOpen: true },
          saturday: { start: '10:00', end: '18:00', isOpen: true },
          sunday: { start: '10:00', end: '18:00', isOpen: false },
        }),
        tokenResetFrequency: 'DAILY',
        autoReassignOnLeave: false,
        maxQueueLength: 50,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      ]);
    }

    // Check if departments already exist
    const [existingDepartments] = await queryInterface.sequelize.query(
      `SELECT id FROM departments WHERE "hospitalId" = '${hospitalId}'`
    );

    if (existingDepartments.length === 0) {
      // Create departments
      await queryInterface.bulkInsert(
        'departments',
        [
          {
            id: '00000000-0000-0000-0000-000000000010',
            hospitalId,
            name: 'Cardiology',
            description: 'Heart and cardiovascular care',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: '00000000-0000-0000-0000-000000000011',
            hospitalId,
            name: 'General Medicine',
            description: 'General medical care',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        {}
      );
    }

    const passwordHash = await bcrypt.hash('password123', 10);

    // Check if users already exist
    const [existingUsers] = await queryInterface.sequelize.query(
      `SELECT id FROM users WHERE "hospitalId" = '${hospitalId}'`
    );

    if (existingUsers.length === 0) {
      // Create users
      await queryInterface.bulkInsert('users', [
      {
        id: '00000000-0000-0000-0000-000000000100',
        hospitalId,
        email: 'owner@demohospital.com',
        passwordHash,
        firstName: 'Hospital',
        lastName: 'Owner',
        role: 'HOSPITAL_OWNER',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '00000000-0000-0000-0000-000000000101',
        hospitalId,
        email: 'receptionist@demohospital.com',
        passwordHash,
        firstName: 'Reception',
        lastName: 'Staff',
        role: 'RECEPTIONIST',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '00000000-0000-0000-0000-000000000102',
        hospitalId,
        email: 'doctor1@demohospital.com',
        passwordHash,
        firstName: 'John',
        lastName: 'Doctor',
        role: 'DOCTOR',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '00000000-0000-0000-0000-000000000103',
        hospitalId,
        email: 'doctor2@demohospital.com',
        passwordHash,
        firstName: 'Jane',
        lastName: 'Physician',
        role: 'DOCTOR',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      ]);
    }

    // Check if doctors already exist
    const [existingDoctors] = await queryInterface.sequelize.query(
      `SELECT id FROM doctors WHERE "hospitalId" = '${hospitalId}'`
    );

    if (existingDoctors.length === 0) {
      // Create doctors
      await queryInterface.bulkInsert('doctors', [
      {
        id: '00000000-0000-0000-0000-000000000200',
        hospitalId,
        userId: '00000000-0000-0000-0000-000000000102',
        departmentId: '00000000-0000-0000-0000-000000000010',
        employeeId: 'DOC001',
        specialization: 'Cardiologist',
        status: 'ACTIVE',
        consultationDuration: 20,
        dailyPatientLimit: 30,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '00000000-0000-0000-0000-000000000201',
        hospitalId,
        userId: '00000000-0000-0000-0000-000000000103',
        departmentId: '00000000-0000-0000-0000-000000000011',
        employeeId: 'DOC002',
        specialization: 'General Practitioner',
        status: 'ACTIVE',
        consultationDuration: 15,
        dailyPatientLimit: 40,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      ]);
    }

    // Check if patients already exist
    const [existingPatients] = await queryInterface.sequelize.query(
      `SELECT id FROM patients WHERE "hospitalId" = '${hospitalId}'`
    );

    if (existingPatients.length === 0) {
      // Create sample patients
      await queryInterface.bulkInsert('patients', [
      {
        id: '00000000-0000-0000-0000-000000000300',
        hospitalId,
        phone: '+1234567891',
        email: 'patient1@example.com',
        firstName: 'Alice',
        lastName: 'Patient',
        dateOfBirth: new Date('1990-01-01'),
        address: '456 Patient Street',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '00000000-0000-0000-0000-000000000301',
        hospitalId,
        phone: '+1234567892',
        email: 'patient2@example.com',
        firstName: 'Bob',
        lastName: 'Patient',
        dateOfBirth: new Date('1985-05-15'),
        address: '789 Patient Avenue',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      ]);
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('patients', {});
    await queryInterface.bulkDelete('doctors', {});
    await queryInterface.bulkDelete('users', {});
    await queryInterface.bulkDelete('departments', {});
    await queryInterface.bulkDelete('hospital_configs', {});
    await queryInterface.bulkDelete('hospitals', {});
  },
};

