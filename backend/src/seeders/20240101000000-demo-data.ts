import { QueryInterface } from 'sequelize';
import bcrypt from 'bcryptjs';

export default {
  async up(queryInterface: QueryInterface): Promise<void> {
    // Create a hospital
    const [hospitals] = await queryInterface.bulkInsert(
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
      { returning: true }
    );

    const hospitalId = '00000000-0000-0000-0000-000000000001';

    // Create hospital config
    await queryInterface.bulkInsert('hospital_configs', [
      {
        id: '00000000-0000-0000-0000-000000000002',
        hospitalId,
        bookingMode: 'TOKEN_ONLY',
        defaultConsultationDuration: 15,
        bufferTimeBetweenAppointments: 5,
        arrivalWindowBeforeAppointment: 15,
        businessHours: {
          monday: { start: '10:00', end: '18:00', isOpen: true },
          tuesday: { start: '10:00', end: '18:00', isOpen: true },
          wednesday: { start: '10:00', end: '18:00', isOpen: true },
          thursday: { start: '10:00', end: '18:00', isOpen: true },
          friday: { start: '10:00', end: '18:00', isOpen: true },
          saturday: { start: '10:00', end: '18:00', isOpen: true },
          sunday: { start: '10:00', end: '18:00', isOpen: false },
        },
        tokenResetFrequency: 'DAILY',
        autoReassignOnLeave: false,
        maxQueueLength: 50,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    // Create departments
    const [departments] = await queryInterface.bulkInsert(
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
      { returning: true }
    );

    const passwordHash = await bcrypt.hash('password123', 10);

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
  },

  async down(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.bulkDelete('patients', {});
    await queryInterface.bulkDelete('doctors', {});
    await queryInterface.bulkDelete('users', {});
    await queryInterface.bulkDelete('departments', {});
    await queryInterface.bulkDelete('hospital_configs', {});
    await queryInterface.bulkDelete('hospitals', {});
  },
};

